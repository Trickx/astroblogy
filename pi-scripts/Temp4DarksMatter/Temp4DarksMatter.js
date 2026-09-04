/*
 * Temp4DarksMatter.js
 * ---------------------------------------------------------------------
 * PixInsight script (PJSR, V8 engine, PixInsight 1.9.4 "Lockhart" or newer)
 *
 * Purpose:
 *   Asks for a folder (typically your Lights folder, which may also
 *   contain Darks, possibly in subfolders), recursively searches it for
 *   FITS/XISF files, identifies Light and Dark frames from the
 *   IMAGETYP/FRAME header, reads CCD-TEMP and writes a new header entry
 *   CAL-TEMP back into the same file. CAL-TEMP is CCD-TEMP rounded to a
 *   selectable degree step (default: 5 °C), e.g.:
 *     CCD-TEMP =  21.7  ->  CAL-TEMP = 20.0   (with a 5°C step)
 *     CCD-TEMP = -8.4   ->  CAL-TEMP = -10.0  (with a 5°C step)
 *
 * Workflow:
 *   - Choose a folder -> a non-destructive preview (reads only, writes
 *     nothing) is generated immediately afterwards in the table.
 *   - Changing the rounding step or the default CCD-TEMP fallback
 *     immediately refreshes the preview as well, with no confirmation
 *     prompt.
 *   - "Start" writes the CAL-TEMP headers into the files right away,
 *     with no confirmation prompt.
 *   - Folder, rounding step and default CCD-TEMP are saved via Settings
 *     and automatically reloaded the next time the script runs
 *     (including an automatic preview, if a folder is available).
 *   - Results are shown as a table (TreeBox) instead of wrapping plain
 *     text, so long file names don't wrap awkwardly.
 *
 * Important:
 *   - Pressing "Start" WRITES the original files in place immediately,
 *     with no confirmation prompt. Please back up your data before the
 *     first productive run.
 *   - Flats/Bias are ignored and trigger an error message.
 *   - Files without a usable CCD-TEMP header fall back to the
 *     configurable default temperature (see the "Default CCD-TEMP"
 *     field); the CCD-TEMP column marks these rows with "(default)".
 *
 * Usage:
 *   PixInsight -> Script -> Execute Script File... -> select this file.
 *   Once installed via an update repository, it is also available under
 *   Script -> Utilities -> Temp4DarksMatter.
 * ---------------------------------------------------------------------
 */

#engine v8

#script-id     Temp4DarksMatter
#feature-id    Utilities > Temp4DarksMatter
#feature-info  Adds a CAL-TEMP FITS header (CCD-TEMP rounded to a chosen \
               step) to Light and Dark frames in a folder, with a \
               configurable default temperature fallback.
#feature-icon  Temp4DarksMatter.svg

// Note: <pjsr/Sizer.jsh> is deliberately NOT included here. Under the
// V8 engine (PixInsight 1.9.4+), HorizontalSizer/VerticalSizer are
// already natively built into the core; the old JS shim from Sizer.jsh
// would declare them a second time ("Identifier ... has already been
// declared").
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/DataType.jsh>

CoreApplication.ensureMinimumVersion( 1, 9, 4 );

// Prefix for all settings persisted by this script.
var SETTINGS_KEY_PREFIX = "Temp4DarksMatter/";

// -----------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------

// Reads the (cleaned-up) value of a FITS keyword from a keyword array,
// or null if the keyword is not present.
function getKeywordValue( keywords, name )
{
   for ( var i = 0; i < keywords.length; ++i )
   {
      if ( keywords[i].name == name )
      {
         var v = ( keywords[i].strippedValue !== undefined ) ?
                     keywords[i].strippedValue : keywords[i].value;
         if ( v === undefined || v === null )
            return null;
         // Strip any remaining quotes/whitespace, just in case.
         return v.toString().replace( /^'+|'+$/g, "" ).trim();
      }
   }
   return null;
}

// Rounds a value to the nearest multiple of binSize.
function roundToBin( value, binSize )
{
   return Math.round( value / binSize ) * binSize;
}

// Recursively searches baseDir for FITS/XISF files and returns an array
// of full paths.
function findCalibrationFiles( baseDir )
{
   var extensions = [ ".fit", ".fits", ".fts", ".xisf" ];
   var result = [];

   function scan( dir )
   {
      var ff = new FileFind;
      if ( ff.begin( dir + "/*" ) )
      {
         do
         {
            if ( ff.name == "." || ff.name == ".." )
               continue;

            var full = dir + "/" + ff.name;

            if ( ff.isDirectory )
            {
               scan( full );
            }
            else
            {
               var ext = File.extractExtension( full ).toLowerCase();
               if ( extensions.indexOf( ext ) >= 0 )
                  result.push( full );
            }
         }
         while ( ff.next() );
      }
   }

   scan( baseDir );
   return result;
}

// Creates a structured log/table entry.
function makeEntry( type, filePath, ccdTemp, calTemp, status )
{
   return {
      type: type,
      file: filePath ? File.extractName( filePath ) + File.extractExtension( filePath ) : "",
      ccdTemp: ccdTemp,
      calTemp: calTemp,
      status: status
   };
}

// Processes a single file: reads IMAGETYP/FRAME and CCD-TEMP, computes
// CAL-TEMP and writes it back (unless in dry-run mode).
// log is an array that a structured entry (see makeEntry) is pushed
// into. Returns true if the file was processed successfully (or
// successfully analyzed in dry-run mode), otherwise false.
function processFile( filePath, binSize, defaultTemp, log, dryRun )
{
   var ext = File.extractExtension( filePath );

   // --- Open for reading ---
   var Fin = new FileFormat( ext, true /*toRead*/, false /*toWrite*/ );
   if ( Fin.isNull )
   {
      log.push( makeEntry( "ERROR", filePath, "", "", "No read format installed" ) );
      return false;
   }

   var fin = new FileFormatInstance( Fin );
   if ( fin.isNull )
   {
      log.push( makeEntry( "ERROR", filePath, "", "", "FileFormatInstance failed" ) );
      return false;
   }

   var descriptions = fin.open( filePath, "" );
   if ( !descriptions || descriptions.length < 1 )
   {
      log.push( makeEntry( "ERROR", filePath, "", "", "Could not open file" ) );
      return false;
   }

   var keywords = fin.keywords;

   // --- Determine frame type ---
   var imageType = ( getKeywordValue( keywords, "IMAGETYP" ) ||
                      getKeywordValue( keywords, "FRAME" ) || "" ).toUpperCase();

   var isLight = imageType.indexOf( "LIGHT" ) >= 0;
   var isDark  = imageType.indexOf( "DARK" )  >= 0;
   var isBias  = imageType.indexOf( "BIAS" )  >= 0;
   var isFlat  = imageType.indexOf( "FLAT" )  >= 0 && !isDark; // a "Dark Flat" counts as Dark, not Flat

   // Bias and Flats are deliberately ignored and trigger an error message
   // (both in the table and in the PixInsight Process Console).
   if ( isBias || isFlat )
   {
      fin.close();
      var kind = isBias ? "BIAS" : "FLAT";
      var consoleMsg = File.extractName( filePath ) + File.extractExtension( filePath ) +
                " is a " + kind + " frame (IMAGETYP='" + imageType +
                "') and is being ignored. Only Light and Dark frames are processed.";
      console.criticalln( "<b>ERROR:</b> " + consoleMsg );
      log.push( makeEntry( kind, filePath, "", "", "Ignored (IMAGETYP='" + imageType + "')" ) );
      return false;
   }

   if ( !isLight && !isDark )
   {
      fin.close();
      log.push( makeEntry( "SKIP", filePath, "", "",
                 "Unknown frame type (IMAGETYP='" + imageType + "')" ) );
      return false;
   }

   // --- Read CCD-TEMP, falling back to the configurable default if missing/invalid ---
   var tempStr = getKeywordValue( keywords, "CCD-TEMP" );
   var temp;
   var usedDefault = false;

   if ( tempStr === null )
   {
      temp = defaultTemp;
      usedDefault = true;
   }
   else
   {
      temp = parseFloat( tempStr );
      if ( isNaN( temp ) )
      {
         temp = defaultTemp;
         usedDefault = true;
      }
   }

   var calTemp = roundToBin( temp, binSize );
   var tag = isLight ? "LIGHT" : "DARK";
   var ccdTempDisplay = temp.toFixed( 1 ) + ( usedDefault ? " (default)" : "" );

   // --- Dry run: only report, write nothing ---
   if ( dryRun )
   {
      fin.close();
      log.push( makeEntry( tag, filePath, ccdTempDisplay, calTemp.toFixed( 0 ), "Preview" ) );
      return true;
   }

   // --- Read image data (needed for writing back) ---
   var image = new Image();
   if ( !fin.readImage( image ) )
   {
      fin.close();
      log.push( makeEntry( "ERROR", filePath, ccdTempDisplay, calTemp.toFixed( 0 ),
                 "Could not read image data" ) );
      return false;
   }
   fin.close();

   // --- New keyword array: remove any old CAL-TEMP entries, append the new one ---
   var newKeywords = [];
   for ( var i = 0; i < keywords.length; ++i )
      if ( keywords[i].name != "CAL-TEMP" )
         newKeywords.push( keywords[i] );

   newKeywords.push( new FITSKeyword(
      "CAL-TEMP",
      "'" + format( "%d", calTemp ) + "'", // written as a FITS string value so PixInsight
                                             // cannot reformat it as a float (e.g. "40.")
      "Dark frame calibration temp."
   ) );

   // --- Open for writing (overwrites the same file) ---
   var Fout = new FileFormat( ext, false /*toRead*/, true /*toWrite*/ );
   if ( Fout.isNull )
   {
      image.free();
      log.push( makeEntry( "ERROR", filePath, ccdTempDisplay, calTemp.toFixed( 0 ),
                 "No write format installed" ) );
      return false;
   }

   var fout = new FileFormatInstance( Fout );
   if ( fout.isNull )
   {
      image.free();
      log.push( makeEntry( "ERROR", filePath, ccdTempDisplay, calTemp.toFixed( 0 ),
                 "Write FileFormatInstance failed" ) );
      return false;
   }

   if ( !fout.create( filePath ) )
   {
      image.free();
      log.push( makeEntry( "ERROR", filePath, ccdTempDisplay, calTemp.toFixed( 0 ),
                 "Could not open file for writing" ) );
      return false;
   }

   fout.keywords = newKeywords;
   var writeOk = fout.writeImage( image );
   fout.close();
   image.free();

   if ( !writeOk )
   {
      log.push( makeEntry( "ERROR", filePath, ccdTempDisplay, calTemp.toFixed( 0 ),
                 "Could not write image data" ) );
      return false;
   }

   log.push( makeEntry( tag, filePath, ccdTempDisplay, calTemp.toFixed( 0 ), "Written" ) );
   return true;
}

// -----------------------------------------------------------------------
// Dialog
// -----------------------------------------------------------------------

class CalTempDialog extends Dialog
{
   constructor()
   {
      super();

      var dialog = this;
      this.lightsDirectory = "";

      // --- Title/info ---
      this.titleLabel = new Label( this );
      this.titleLabel.text = "Calculate CAL-TEMP from CCD-TEMP";
      this.titleLabel.font = new Font( this.font.family, this.font.pointSize + 2 );
      this.titleLabel.bold = true;

      this.infoLabel = new Label( this );
      this.infoLabel.useRichText = true;
      this.infoLabel.text =
         "Recursively searches the chosen folder for Light and Dark frames (FIT/FITS/FTS/XISF), <br>" +
         "reads CCD-TEMP and writes a new header entry CAL-TEMP (CCD-TEMP rounded to the chosen step) " +
         "directly back into the file. <br>" +
         "Flats/Bias are ignored.";
      this.infoLabel.wordWrapping = true;

      // --- Folder selection ---
      this.dirEdit = new Edit( this );
      this.dirEdit.readOnly = true;
      this.dirEdit.text = "";

      this.dirButton = new PushButton( this );
      this.dirButton.text = "Choose Folder...";
      this.dirButton.onClick = function()
      {
         var gdd = new GetDirectoryDialog;
         gdd.caption = "Choose a folder with Lights (and Darks, possibly in subfolders)";
         if ( gdd.execute() )
         {
            dialog.lightsDirectory = gdd.directory;
            dialog.dirEdit.text = gdd.directory;
            dialog.saveSettings();
            dialog.runPreview();
         }
      };

      this.dirSizer = new HorizontalSizer;
      this.dirSizer.spacing = 6;
      this.dirSizer.add( this.dirEdit, 100 );
      this.dirSizer.add( this.dirButton );

      // --- Rounding step ---
      this.binLabel = new Label( this );
      this.binLabel.text = "Rounding step (°C):";
      this.binLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      this.binSpinBox = new SpinBox( this );
      this.binSpinBox.minValue = 1;
      this.binSpinBox.maxValue = 20;
      this.binSpinBox.value = 5; // default per requirement: 5°C steps
      this.binSpinBox.onValueUpdated = function( value )
      {
         dialog.saveSettings();
         dialog.runPreview(); // refreshes the table immediately, no confirmation prompt
      };

      // --- Default CCD-TEMP fallback (used when a file has no CCD-TEMP header) ---
      this.defaultTempLabel = new Label( this );
      this.defaultTempLabel.text = "Default CCD-TEMP (°C):";
      this.defaultTempLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      this.defaultTempSpinBox = new SpinBox( this );
      this.defaultTempSpinBox.minValue = -50;
      this.defaultTempSpinBox.maxValue = 50;
      this.defaultTempSpinBox.value = 20;
      this.defaultTempSpinBox.onValueUpdated = function( value )
      {
         dialog.saveSettings();
         dialog.runPreview(); // refreshes the table immediately, no confirmation prompt
      };

      this.binSizer = new HorizontalSizer;
      this.binSizer.spacing = 6;
      this.binSizer.add( this.binLabel );
      this.binSizer.add( this.binSpinBox );
      this.binSizer.addSpacing( 16 );
      this.binSizer.add( this.defaultTempLabel );
      this.binSizer.add( this.defaultTempSpinBox );
      this.binSizer.addStretch();

      // --- Summary ---
      this.summaryLabel = new Label( this );
      this.summaryLabel.text = "No folder selected yet.";

      // --- Result table (instead of wrapping plain text) ---
      this.fileTable = new TreeBox( this );
      this.fileTable.numberOfColumns = 5;
      this.fileTable.headerVisible = true;
      this.fileTable.rootDecoration = false; // flat list, no tree indentation
      this.fileTable.setHeaderText( 0, "Type" );
      this.fileTable.setHeaderText( 1, "File" );
      this.fileTable.setHeaderText( 2, "CCD-TEMP" );
      this.fileTable.setHeaderText( 3, "CAL-TEMP" );
      this.fileTable.setHeaderText( 4, "Status" );
      this.fileTable.setColumnWidth( 0, 55 );
      this.fileTable.setColumnWidth( 1, 420 );
      this.fileTable.setColumnWidth( 2, 75 );
      this.fileTable.setColumnWidth( 3, 75 );
      this.fileTable.setColumnWidth( 4, 150 );
      this.fileTable.setMinSize( 780, 320 );

      this.clearTable = function()
      {
         dialog.fileTable.clear();
      };

      this.addRow = function( entry )
      {
         var node = new TreeBoxNode( dialog.fileTable );
         node.setText( 0, entry.type );
         node.setText( 1, entry.file );
         node.setText( 2, entry.ccdTemp );
         node.setText( 3, entry.calTemp );
         node.setText( 4, entry.status );
      };

      // --- Buttons ---
      this.runButton = new PushButton( this );
      this.runButton.text = "Start";
      this.runButton.onClick = function() { dialog.runProcessing(); };

      this.closeButton = new PushButton( this );
      this.closeButton.text = "Close";
      this.closeButton.onClick = function() { dialog.cancel(); };

      this.buttonSizer = new HorizontalSizer;
      this.buttonSizer.spacing = 6;
      this.buttonSizer.addStretch();
      this.buttonSizer.add( this.runButton );
      this.buttonSizer.add( this.closeButton );

      // --- Layout ---
      this.sizer = new VerticalSizer;
      this.sizer.margin = 8;
      this.sizer.spacing = 6;
      this.sizer.add( this.titleLabel );
      this.sizer.add( this.infoLabel );
      this.sizer.addSpacing( 6 );
      this.sizer.add( this.dirSizer );
      this.sizer.add( this.binSizer );
      this.sizer.addSpacing( 4 );
      this.sizer.add( this.fileTable, 100 );
      this.sizer.addSpacing( 4 );
      this.sizer.add( this.summaryLabel );
      this.sizer.add( this.buttonSizer );

      this.windowTitle = "Temp4DarksMatter — CAL-TEMP from CCD-TEMP (Light + Dark)";
      this.adjustToContents();

      // --- Persist/load settings ---
      this.saveSettings = function()
      {
         Settings.write( SETTINGS_KEY_PREFIX + "lastDirectory", DataType_String, dialog.lightsDirectory );
         Settings.write( SETTINGS_KEY_PREFIX + "binSize", DataType_Int32, dialog.binSpinBox.value );
         Settings.write( SETTINGS_KEY_PREFIX + "defaultTemp", DataType_Int32, dialog.defaultTempSpinBox.value );
      };

      this.loadSettings = function()
      {
         var dir = Settings.read( SETTINGS_KEY_PREFIX + "lastDirectory", DataType_String );
         if ( Settings.lastReadOK && dir )
         {
            dialog.lightsDirectory = dir;
            dialog.dirEdit.text = dir;
         }

         var bin = Settings.read( SETTINGS_KEY_PREFIX + "binSize", DataType_Int32 );
         if ( Settings.lastReadOK && bin )
            dialog.binSpinBox.value = bin;

         var defTemp = Settings.read( SETTINGS_KEY_PREFIX + "defaultTemp", DataType_Int32 );
         if ( Settings.lastReadOK && defTemp !== undefined && defTemp !== null )
            dialog.defaultTempSpinBox.value = defTemp;
      };

      // --- Core processing (shared by preview and start) ---
      this.executeBatch = function( dryRun )
      {
         dialog.clearTable();
         dialog.runButton.enabled = false;
         dialog.dirButton.enabled = false;
         dialog.summaryLabel.text = "Scanning folder...";
         CoreApplication.processEvents();

         var binSize = dialog.binSpinBox.value;
         var defaultTemp = dialog.defaultTempSpinBox.value;
         var files = findCalibrationFiles( dialog.lightsDirectory );

         var stats = { processed: 0, skipped: 0, lights: 0, darks: 0, bias: 0, flat: 0 };

         for ( var i = 0; i < files.length; ++i )
         {
            var entry = [];
            var ok = processFile( files[i], binSize, defaultTemp, entry, dryRun );

            for ( var k = 0; k < entry.length; ++k )
               dialog.addRow( entry[k] );

            if ( ok )
            {
               stats.processed++;
               if ( entry.length && entry[0].type == "LIGHT" ) stats.lights++;
               if ( entry.length && entry[0].type == "DARK" )  stats.darks++;
            }
            else
            {
               stats.skipped++;
               if ( entry.length && entry[0].type == "BIAS" ) stats.bias++;
               if ( entry.length && entry[0].type == "FLAT" ) stats.flat++;
            }

            if ( i % 10 == 0 )
               CoreApplication.processEvents();
         }

         dialog.summaryLabel.text =
            ( dryRun ? "Preview" : "Done" ) +
            "  |  Step: " + binSize + "°C  |  Found: " + files.length +
            "  |  Analysed: " + stats.processed +
            " (Lights: " + stats.lights + ", Darks: " + stats.darks + ")" +
            "  |  Skipped: " + stats.skipped +
            " (Bias: " + stats.bias + ", Flats: " + stats.flat + ")";

         // Summary error message if Bias and/or Flat files were found.
         if ( stats.bias + stats.flat > 0 )
         {
            ( new MessageBox(
               "Found and ignored " + stats.bias + " Bias and " + stats.flat +
               " Flat file(s) (see table for details). Only Light and Dark " +
               "frames are given a CAL-TEMP entry.",
               "Error: Bias/Flat frames found",
               StdIcon_Error,
               StdButton_Ok
            ) ).execute();
         }

         dialog.runButton.enabled = true;
         dialog.dirButton.enabled = true;
      };

      // Automatic, non-destructive preview (e.g. right after choosing a folder).
      this.runPreview = function()
      {
         if ( dialog.lightsDirectory == "" )
            return;
         dialog.executeBatch( true );
      };

      // Actual writing, triggered by the "Start" button.
      this.runProcessing = function()
      {
         if ( dialog.lightsDirectory == "" )
         {
            ( new MessageBox( "Please select a folder first.",
               "Notice", StdIcon_Warning, StdButton_Ok ) ).execute();
            return;
         }

         dialog.saveSettings();
         dialog.executeBatch( false );
      };

      // --- Load saved settings and show a preview right away, if applicable ---
      this.loadSettings();
      if ( this.lightsDirectory != "" )
         this.runPreview();
   }
}

// -----------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------

function main()
{
   console.show();
   var dlg = new CalTempDialog();
   dlg.execute();
}

main();

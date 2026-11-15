// ============================================================================
// FilterZWOFit.js  -  PixInsight 1.9.x (PJSR / V8)
// ----------------------------------------------------------------------------
// Writes the FILTER keyword in the FITS header of the active image or in
// batch mode for all supported images in a selected folder (including all
// subfolders, recursively).
//
// In batch mode only light and flat frames are processed by default: files
// whose IMAGETYP header identifies them as dark, dark flat or bias frames are
// skipped. Files without IMAGETYP are treated as lights.
//
// Supports process icons and remembers the last-used batch folder and filter
// value through PixInsight settings.
//
// This script is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3.
// SPDX-License-Identifier: GPL-3.0-only
// ============================================================================

#engine v8

#script-id     FilterZWOFit
#feature-id    Tricx > FilterZWOFit
#feature-info  Sets the FILTER value in the FITS header of the active image or in batch mode for a selected folder and its subfolders.
#feature-icon  FilterZWOFit.svg

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/DataType.jsh>

var DEBUG_ENABLED = true;
var SUPPORTED_IMAGE_EXTENSIONS = [ ".fit", ".fits", ".fts", ".xisf" ];
var SETTINGS_PREFIX = "FilterZWOFit";
var SETTINGS_KEY_LAST_BATCH_DIR = SETTINGS_PREFIX + "/LastBatchDirectory";
var SETTINGS_KEY_LAST_FILTER = SETTINGS_PREFIX + "/LastFilter";
var SETTINGS_KEY_FILTER_TEXT = SETTINGS_PREFIX + "/FilterText";
var SETTINGS_KEY_LIGHTS_FLATS_ONLY = SETTINGS_PREFIX + "/LightsFlatsOnly";

function logDebug( msg )
{
   if ( !DEBUG_ENABLED )
      return;
   console.show();
   console.noteln( "[FilterZWOFit][DEBUG] " + msg );
}

function logWarn( msg )
{
   console.show();
   console.warningln( "[FilterZWOFit][WARN] " + msg );
}

function logError( msg )
{
   console.show();
   console.criticalln( "[FilterZWOFit][ERROR] " + msg );
}

function readSettingString( key, defaultValue )
{
   try
   {
      var v = Settings.read( key, DataType_String );
      if ( v == null )
         return defaultValue;
      var s = String( v );
      return s.length > 0 ? s : defaultValue;
   }
   catch ( ex )
   {
         logWarn( "Settings.read failed for " + key + ": " + ex );
      return defaultValue;
   }
}

function writeSettingString( key, value )
{
   try
   {
      Settings.write( key, DataType_String, value );
      logDebug( "Setting stored: " + key + " = " + value );
   }
   catch ( ex )
   {
      logWarn( "Settings.write failed for " + key + ": " + ex );
   }
}

function readSettingBoolean( key, defaultValue )
{
   try
   {
      var v = Settings.read( key, DataType_Boolean );
      return Settings.lastReadOK ? Boolean( v ) : defaultValue;
   }
   catch ( ex )
   {
      logWarn( "Settings.read failed for " + key + ": " + ex );
      return defaultValue;
   }
}

function writeSettingBoolean( key, value )
{
   try
   {
      Settings.write( key, DataType_Boolean, value );
      logDebug( "Setting stored: " + key + " = " + value );
   }
   catch ( ex )
   {
      logWarn( "Settings.write failed for " + key + ": " + ex );
   }
}

function saveFilterTextToSettings( text )
{
   writeSettingString( SETTINGS_KEY_FILTER_TEXT, text );
}

function findFilterIndex( filters, filterValue )
{
   var target = trimText( filterValue ).toUpperCase();
   if ( target.length == 0 )
      return -1;

   var i;
   for ( i = 0; i < filters.length; ++i )
      if ( trimText( filters[i] ).toUpperCase() == target )
         return i;

   return -1;
}

function trimText( s )
{
   return s.replace( /^\s+|\s+$/g, "" );
}

function fitsStringValue( s )
{
   // FITS string values must be enclosed in single quotes.
   // Single quotes in content are escaped by doubling them.
   return "'" + s.replace( /'/g, "''" ) + "'";
}

function normalizeFilterToken( s )
{
   return trimText( s );
}

function parseFilterLine( line, outFilters, seen )
{
   var clean = trimText( line );
   if ( clean.length == 0 )
      return;
   if ( clean.charAt( 0 ) == "#" )
      return;

   var parts = clean.split( /[,;]+/ );
   var i;
   for ( i = 0; i < parts.length; ++i )
   {
      var token = normalizeFilterToken( parts[i] );
      if ( token.length == 0 )
         continue;

      var key = token.toUpperCase();
      if ( seen[key] )
         continue;

      seen[key] = true;
      outFilters.push( token );
   }
}

function loadFiltersFromText( text, sourceLabel )
{
   var lines = text.split( /\r\n|\n|\r/ );
   var filters = [];
   var seen = {};
   var i;
   for ( i = 0; i < lines.length; ++i )
      parseFilterLine( lines[i], filters, seen );

   logDebug( "Filter list read from " + sourceLabel + ". Lines: " + lines.length + ", valid filters: " + filters.length );

   return filters;
}

function defaultFilterFileTemplate()
{
   return "#Filter List\n" +
          "L\n" +
          "R\n" +
          "G\n" +
          "B\n" +
          "Ha\n" +
          "OIII\n" +
          "SII\n" +
          "IDAS NB1\n";
}

function endsWith( s, suffix )
{
   return s.length >= suffix.length && s.substr( s.length - suffix.length ) == suffix;
}

function isSupportedImageFile( filePath )
{
   var lower = filePath.toLowerCase();
   var i;
   for ( i = 0; i < SUPPORTED_IMAGE_EXTENSIONS.length; ++i )
      if ( endsWith( lower, SUPPORTED_IMAGE_EXTENSIONS[i] ) )
         return true;
   return false;
}

// Recursively collects all supported image files in directory and all of
// its subdirectories.
function listBatchFiles( directory )
{
   var files = [];

   function joinPath( dir, name )
   {
      return ( dir.charAt( dir.length-1 ) == '/' ) ? dir + name : dir + "/" + name;
   }

   function scan( dir )
   {
      var f = new FileFind;
      if ( !f.begin( joinPath( dir, "*" ) ) )
         return;

      // Collect first, then recurse, so only one FileFind is active per level.
      var subDirs = [];
      do
      {
         if ( f.name == "." || f.name == ".." )
            continue;

         var fullPath = joinPath( dir, f.name );

         if ( f.isDirectory )
            subDirs.push( fullPath );
         else if ( isSupportedImageFile( fullPath ) )
            files.push( fullPath );
      }
      while ( f.next() );
      f.end();

      var i;
      for ( i = 0; i < subDirs.length; ++i )
         scan( subDirs[i] );
   }

   scan( directory );
   files.sort();
   return files;
}

// ----------------------------------------------------------------------------
// Frame type detection (IMAGETYP)
// ----------------------------------------------------------------------------
// Typical values: ASIAIR "Light"/"Dark"/"Bias"/"Flat"/"Dark Flat",
// N.I.N.A. "LIGHT"/"DARK"/"BIAS"/"FLAT"/"DARKFLAT",
// MaxIm/SGP/APT "Light Frame"/"Dark Frame"/"Bias Frame"/"Flat Field".

function keywordStringValue( keyword )
{
   var v = ( keyword.strippedValue !== undefined ) ? keyword.strippedValue : keyword.value;
   v = trimText( String( v ) );
   if ( v.length >= 2 && v.charAt( 0 ) == "'" && v.charAt( v.length-1 ) == "'" )
      v = trimText( v.substr( 1, v.length-2 ).replace( /''/g, "'" ) );
   return v;
}

// Returns the IMAGETYP value, "" if the keyword is missing, or null if the
// keyword list is not available.
function imageTypeFromKeywords( keywords )
{
   if ( keywords == null )
      return null;
   var i;
   for ( i = 0; i < keywords.length; ++i )
      if ( keywords[i].name.toUpperCase() == "IMAGETYP" )
         return keywordStringValue( keywords[i] );
   return "";
}

// Reads the header keywords without loading pixel data. Returns null on
// failure.
function readHeaderKeywords( filePath )
{
   try
   {
      var fmt = new FileFormat( File.extractExtension( filePath ), true/*toRead*/, false/*toWrite*/ );
      if ( fmt.isNull )
         return null;

      var f = new FileFormatInstance( fmt );
      if ( f.isNull )
         return null;

      var descriptions = f.open( filePath, "verbosity 0" );
      if ( descriptions == null || descriptions.length < 1 )
         return null;

      var keywords = fmt.canStoreKeywords ? f.keywords : [];
      f.close();
      return keywords;
   }
   catch ( ex )
   {
      logWarn( "Could not read header of " + filePath + ": " + ex );
      return null;
   }
}

// Classifies an IMAGETYP value.
// Returns { process: Boolean, kind: String }.
function classifyImageType( imageType )
{
   var t = imageType.toLowerCase();

   if ( t.length == 0 )
      return { process: true, kind: "unknown (no IMAGETYP, treated as light)" };

   // Check calibration types first: "Dark Flat" also contains "flat".
   if ( t.indexOf( "dark" ) >= 0 )
      return { process: false, kind: "dark" };
   if ( t.indexOf( "bias" ) >= 0 || t.indexOf( "offset" ) >= 0 || t == "zero" )
      return { process: false, kind: "bias" };

   if ( t.indexOf( "flat" ) >= 0 )
      return { process: true, kind: "flat" };
   if ( t.indexOf( "light" ) >= 0 || t.indexOf( "object" ) >= 0 || t.indexOf( "science" ) >= 0 )
      return { process: true, kind: "light" };

   return { process: false, kind: "other (" + imageType + ")" };
}

function processBatchDirectory( directory, filterText, lightsFlatsOnly )
{
   var files = listBatchFiles( directory );
   return processBatchFiles( files, filterText, lightsFlatsOnly );
}

function processBatchFiles( files, filterText, lightsFlatsOnly )
{
   logDebug( "Batch files found: " + files.length );
   logDebug( "Lights/flats only: " + ( lightsFlatsOnly ? "yes" : "no" ) );

   var result = {
      total: files.length,
      success: 0,
      skipped: 0,
      failed: 0
   };

   var i;
   for ( i = 0; i < files.length; ++i )
   {
      var filePath = files[i];
      logDebug( "Batch processing: " + filePath );

      // Fast pre-check on the header only. If the header cannot be read
      // here, the check is repeated after opening the image.
      var typeChecked = false;
      if ( lightsFlatsOnly )
      {
         var preType = imageTypeFromKeywords( readHeaderKeywords( filePath ) );
         if ( preType != null )
         {
            typeChecked = true;
            var preClass = classifyImageType( preType );
            if ( !preClass.process )
            {
               console.writeln( "[FilterZWOFit] Skipped (" + preClass.kind + "): " + filePath );
               ++result.skipped;
               continue;
            }
            logDebug( "Frame type: " + preClass.kind );
         }
      }

      var windows = null;
      try
      {
         windows = ImageWindow.open( filePath );
         if ( windows == null || windows.length < 1 )
            throw "File could not be opened.";

         var w = windows[0];

         if ( lightsFlatsOnly && !typeChecked )
         {
            var postClass = classifyImageType( imageTypeFromKeywords( w.keywords ) );
            if ( !postClass.process )
            {
               console.writeln( "[FilterZWOFit] Skipped (" + postClass.kind + "): " + filePath );
               ++result.skipped;
               continue;
            }
            logDebug( "Frame type: " + postClass.kind );
         }

         var action = upsertFilterKeyword( w, filterText );
         if ( !w.saveAs( filePath, false, false, false, false ) )
            throw "File could not be saved.";

         logDebug( "Batch OK (" + action + "): " + filePath );
         ++result.success;
      }
      catch ( ex )
      {
         logError( "Batch error on " + filePath + ": " + ex );
         ++result.failed;
      }
      finally
      {
         if ( windows != null )
         {
            var k;
            for ( k = 0; k < windows.length; ++k )
               if ( !windows[k].isNull )
                  windows[k].forceClose();
         }
      }
   }

   return result;
}

function upsertFilterKeyword( window, filterText )
{
   var keywords = window.keywords;
   var value = fitsStringValue( filterText );
   var i;

   logDebug( "Setting FILTER to: " + filterText );

   for ( i = 0; i < keywords.length; ++i )
      if ( keywords[i].name.toUpperCase() == "FILTER" )
      {
         keywords[i] = new FITSKeyword( "FILTER", value, "Optical filter" );
         window.keywords = keywords;
         logDebug( "FILTER keyword updated." );
         return "updated";
      }

   keywords.push( new FITSKeyword( "FILTER", value, "Optical filter" ) );
   window.keywords = keywords;
   logDebug( "FILTER keyword created." );
   return "created";
}

class FilterFileEditorDialog extends Dialog {
   constructor( sourceLabel, initialText ) {
      super();

      this.windowTitle = "FilterZWOFit - Edit filter list";
      this.sourceLabel = sourceLabel;
      this.editedText = initialText;

      this.pathLabel = new Label( this );
      this.pathLabel.useRichText = true;
      this.pathLabel.wordWrapping = true;
      this.pathLabel.text = "Storage: " + sourceLabel;

      this.editor = new TextBox( this );
      this.editor.text = initialText;
      this.editor.minWidth = this.font.width( "X" ) * 60;
      this.editor.minHeight = this.font.height * 16;

      this.saveButton = new PushButton( this );
      this.saveButton.text = "Save";
      this.saveButton.defaultButton = true;
      this.saveButton.onClick = function()
      {
         this.dialog.editedText = this.dialog.editor.text;
         this.dialog.ok();
      };

      this.cancelButton = new PushButton( this );
      this.cancelButton.text = "Cancel";
      this.cancelButton.onClick = function()
      {
         this.dialog.cancel();
      };

      this.buttonSizer = new HorizontalSizer;
      this.buttonSizer.spacing = 8;
      this.buttonSizer.addStretch();
      this.buttonSizer.add( this.saveButton );
      this.buttonSizer.add( this.cancelButton );

      this.sizer = new VerticalSizer;
      this.sizer.margin = 10;
      this.sizer.spacing = 8;
      this.sizer.add( this.pathLabel );
      this.sizer.add( this.editor, 100 );
      this.sizer.add( this.buttonSizer );

      this.adjustToContents();
   }
}

class FilterDialog extends Dialog {
   constructor() {
      super();

      this.windowTitle = "FilterZWOFit - Set FILTER in FITS Header";
      this.filterText = "";
      this.filters = [];
      this.runMode = "single";
      this.batchDirectory = "";
      this.batchFiles = [];
      this.batchSelectionMode = "folder";
      this.lastBatchDirectory = readSettingString( SETTINGS_KEY_LAST_BATCH_DIR, File.currentWorkingDirectory );
      this.lastFilterValue = readSettingString( SETTINGS_KEY_LAST_FILTER, "" );
      this.lightsFlatsOnly = readSettingBoolean( SETTINGS_KEY_LIGHTS_FLATS_ONLY, true );

      this.helpLabel = new Label( this );
      this.helpLabel.useRichText = true;
      this.helpLabel.wordWrapping = true;
      var tooltipFromList = "Filter List: Select a filter loaded from your saved filter list.";
      var tooltipManual = "Filter String: Enter or edit the FILTER value that will be written to FITS headers.";
      var tooltipApply = "Apply: Write FILTER to the active image.";
      var tooltipBatch = "Batch...: Process all supported files from the selected folder (including all subfolders) or files.";
      var tooltipEdit = "Edit...: Open the filter-list editor.";
      var tooltipCancel = "Cancel: Close this dialog without changes.";
      this.helpLabel.text =
         "This script writes the selected filter value to the FILTER keyword in the FITS header.";

      var labelWidth = this.font.width( "Filter String:" ) + 8;
      var valueWidth = this.font.width( "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" );

      this.editFilterFileButton = new PushButton( this );
      this.editFilterFileButton.text = "Edit...";
      this.editFilterFileButton.toolTip = tooltipEdit;
      this.editFilterFileButton.onClick = function()
      {
         var storedText = readSettingString( SETTINGS_KEY_FILTER_TEXT, "" );
         var text = (storedText.length > 0) ? storedText : defaultFilterFileTemplate();
         var editorDlg = new FilterFileEditorDialog( "User settings", text );
         if ( !editorDlg.execute() )
            return;

         try
         {
            saveFilterTextToSettings( editorDlg.editedText );
            logDebug( "Filter list saved in user settings." );

            this.dialog.loadFilterValues();
         }
         catch ( ex2 )
         {
            logError( "Could not save filter list: " + ex2 );
            (new MessageBox(
               "Error while saving filter list:\n" + ex2,
               "FilterZWOFit",
               StdIcon_Error,
               StdButton_Ok
            )).execute();
         }
      };

      this.selectLabel = new Label( this );
      this.selectLabel.text = "Filter List:";
      this.selectLabel.minWidth = labelWidth;
      this.selectLabel.toolTip = tooltipFromList;

      this.filterCombo = new ComboBox( this );
      this.filterCombo.editEnabled = false;
      this.filterCombo.minWidth = valueWidth;
      this.filterCombo.toolTip = tooltipFromList;
      this.filterCombo.onItemSelected = function( index )
      {
         if ( index < 0 )
            return;
         this.dialog.filterEdit.text = this.itemText( index );
      };

      this.selectSizer = new HorizontalSizer;
      this.selectSizer.spacing = 6;
      this.selectSizer.add( this.selectLabel );
      this.selectSizer.add( this.filterCombo, 100 );

      this.filterLabel = new Label( this );
      this.filterLabel.text = "Filter String:";
      this.filterLabel.minWidth = labelWidth;
      this.filterLabel.toolTip = tooltipManual;

      this.filterEdit = new Edit( this );
      this.filterEdit.minWidth = this.font.width( "XXXXXXXXXXXX" ) * 2;
      this.filterEdit.toolTip = tooltipManual;
      if ( this.lastFilterValue.length > 0 )
         this.filterEdit.text = this.lastFilterValue;

      this.inputSizer = new HorizontalSizer;
      this.inputSizer.spacing = 6;
      this.inputSizer.add( this.filterLabel );
      this.inputSizer.add( this.filterEdit, 100 );

      this.lightsFlatsCheck = new CheckBox( this );
      this.lightsFlatsCheck.text = "Batch: only Lights and Flats (skip Darks, Dark Flats, Bias)";
      this.lightsFlatsCheck.toolTip =
         "<p>Batch mode only: reads IMAGETYP from each file header and processes only " +
         "light and flat frames. Darks, dark flats and bias frames are skipped.</p>" +
         "<p>Files without IMAGETYP are treated as lights.</p>";
      this.lightsFlatsCheck.checked = this.lightsFlatsOnly;
      this.lightsFlatsCheck.onCheck = function( checked )
      {
         this.dialog.lightsFlatsOnly = checked;
         writeSettingBoolean( SETTINGS_KEY_LIGHTS_FLATS_ONLY, checked );
      };

      this.checkSizer = new HorizontalSizer;
      this.checkSizer.addSpacing( labelWidth + 6 );
      this.checkSizer.add( this.lightsFlatsCheck );
      this.checkSizer.addStretch();

      this.okButton = new PushButton( this );
      this.okButton.text = "Apply";
      this.okButton.toolTip = tooltipApply;
      this.okButton.defaultButton = true;
      this.okButton.onClick = function()
      {
         var t = trimText( this.dialog.filterEdit.text );
         if ( t.length == 0 )
         {
            (new MessageBox(
               "Please enter a non-empty FILTER value.",
               "FilterZWOFit",
               StdIcon_Warning,
               StdButton_Ok
            )).execute();
            return;
         }

         this.dialog.filterText = t;
         writeSettingString( SETTINGS_KEY_LAST_FILTER, t );
         this.dialog.runMode = "single";
         this.dialog.ok();
      };

      this.batchButton = new PushButton( this );
      this.batchButton.text = "Batch...";
      this.batchButton.toolTip = tooltipBatch;
      this.batchButton.onClick = function()
      {
         var t = trimText( this.dialog.filterEdit.text );
         if ( t.length == 0 )
         {
            (new MessageBox(
               "Please enter a non-empty FILTER value.",
               "FilterZWOFit",
               StdIcon_Warning,
               StdButton_Ok
            )).execute();
            return;
         }

         if ( this.dialog.batchSelectionMode == "folder" )
         {
            var gdd = new GetDirectoryDialog;
            gdd.caption = "Choose batch folder";
            gdd.initialPath = this.dialog.lastBatchDirectory;
            if ( !gdd.execute() )
            {
               logDebug( "Batch folder selection canceled." );
               return;
            }

            this.dialog.filterText = t;
            this.dialog.batchDirectory = gdd.directory;
            this.dialog.batchFiles = [];
            this.dialog.lastBatchDirectory = gdd.directory;
            writeSettingString( SETTINGS_KEY_LAST_BATCH_DIR, gdd.directory );
            writeSettingString( SETTINGS_KEY_LAST_FILTER, t );
            this.dialog.runMode = "batch";
            this.dialog.ok();
            return;
         }

         var ofd = new OpenFileDialog;
         ofd.caption = "Choose image files";
         ofd.initialPath = this.dialog.lastBatchDirectory;
         ofd.multipleSelections = true;
         ofd.filters = [
            [ "FITS and XISF files", "*.fit;*.fits;*.fts;*.xisf" ]
         ];
         if ( !ofd.execute() )
         {
            logDebug( "Batch file selection canceled." );
            return;
         }

         var selectedFiles = [];
         var i;
         for ( i = 0; i < ofd.fileNames.length; ++i )
            if ( isSupportedImageFile( ofd.fileNames[i] ) )
               selectedFiles.push( ofd.fileNames[i] );

         if ( selectedFiles.length == 0 )
         {
            (new MessageBox(
               "No supported FITS or XISF files were selected.",
               "FilterZWOFit",
               StdIcon_Warning,
               StdButton_Ok
            )).execute();
            return;
         }

         this.dialog.filterText = t;
         this.dialog.batchDirectory = "";
         this.dialog.batchFiles = selectedFiles;
         this.dialog.lastBatchDirectory = File.extractDirectory( selectedFiles[0] );
         writeSettingString( SETTINGS_KEY_LAST_BATCH_DIR, this.dialog.lastBatchDirectory );
         writeSettingString( SETTINGS_KEY_LAST_FILTER, t );
         this.dialog.runMode = "batch-files";
         this.dialog.ok();
      };

      this.batchModeButton = new ToolButton( this );
      this.batchModeButton.text = "\u25BE";
      this.batchModeButton.toolTip = "Switch between Folder and Files batch selection.";
      this.batchModeButton.onClick = function()
      {
         this.dialog.batchSelectionMode =
            this.dialog.batchSelectionMode == "folder" ? "files" : "folder";
         this.dialog.batchButton.text =
            this.dialog.batchSelectionMode == "folder" ? "Folder..." : "Files...";
      };
      this.batchButton.text = "Folder...";

      this.batchSizer = new HorizontalSizer;
      this.batchSizer.spacing = 0;
      this.batchSizer.add( this.batchButton );
      this.batchSizer.add( this.batchModeButton );

      this.cancelButton = new PushButton( this );
      this.cancelButton.text = "Cancel";
      this.cancelButton.toolTip = tooltipCancel;
      this.cancelButton.onClick = function()
      {
         this.dialog.cancel();
      };

      this.buttonSizer = new HorizontalSizer;
      this.buttonSizer.spacing = 8;
      this.buttonSizer.addStretch();
      this.buttonSizer.add( this.okButton );
      this.buttonSizer.add( this.batchSizer );
      this.buttonSizer.add( this.cancelButton );
      this.buttonSizer.add( this.editFilterFileButton );

      this.sizer = new VerticalSizer;
      this.sizer.margin = 10;
      this.sizer.spacing = 8;
      this.sizer.add( this.helpLabel );
      this.sizer.add( this.selectSizer );
      this.sizer.add( this.inputSizer );
      this.sizer.add( this.checkSizer );
      this.sizer.addSpacing( 4 );
      this.sizer.add( this.buttonSizer );

      this.adjustToContents();
      this.setFixedSize();

      this.loadFilterValues();
   }
}

FilterDialog.prototype.populateFilterCombo = function( filters )
{
   this.filterCombo.clear();

   var i;
   for ( i = 0; i < filters.length; ++i )
      this.filterCombo.addItem( filters[i] );

   if ( filters.length > 0 )
      this.filterCombo.currentItem = 0;
};

FilterDialog.prototype.loadFilterValues = function()
{
   var storedText = readSettingString( SETTINGS_KEY_FILTER_TEXT, "" );
   if ( storedText.length > 0 )
   {
      try
      {
         var stored = loadFiltersFromText( storedText, "user settings" );
         this.filters = stored;
         this.populateFilterCombo( stored );

         if ( stored.length > 0 )
         {
            var sidx = findFilterIndex( stored, this.lastFilterValue );
            if ( sidx >= 0 )
            {
               this.filterCombo.currentItem = sidx;
               this.filterEdit.text = stored[sidx];
            }
            else if ( trimText( this.filterEdit.text ).length == 0 )
            {
               this.filterCombo.currentItem = 0;
               this.filterEdit.text = stored[0];
            }
            logDebug( "Filter list loaded from user settings: " + stored.length + " entries" );
         }
         else
         {
            this.filterEdit.text = "";
            logWarn( "Stored filter list exists but has no valid entries." );
         }

         return;
      }
      catch ( storedEx )
      {
         logWarn( "Could not load filter list from user settings: " + storedEx );
      }
   }

   var defaultsText = defaultFilterFileTemplate();
   var defaults = loadFiltersFromText( defaultsText, "built-in defaults" );
   this.filters = defaults;
   this.populateFilterCombo( defaults );
   saveFilterTextToSettings( defaultsText );

   if ( defaults.length > 0 )
   {
      var didx = findFilterIndex( defaults, this.lastFilterValue );
      if ( didx >= 0 )
      {
         this.filterCombo.currentItem = didx;
         this.filterEdit.text = defaults[didx];
      }
      else if ( trimText( this.filterEdit.text ).length == 0 )
      {
         this.filterCombo.currentItem = 0;
         this.filterEdit.text = defaults[0];
      }
      logDebug( "Filter list initialized from built-in defaults: " + defaults.length + " entries" );
   }
   else
   {
      this.filterEdit.text = "";
      logWarn( "Built-in defaults exist but no valid filter entries were found." );
   }
};

function main()
{
   logDebug( "Script started" );
   logDebug( "Saved last batch folder key: " + SETTINGS_KEY_LAST_BATCH_DIR );
   logDebug( "Saved last filter key: " + SETTINGS_KEY_LAST_FILTER );

   var dlg = new FilterDialog;
   if ( !dlg.execute() )
   {
      logDebug( "Dialog canceled." );
      return;
   }

   if ( dlg.runMode == "batch" || dlg.runMode == "batch-files" )
   {
      var batchDir = trimText( dlg.batchDirectory );
      var r;
      var batchTarget;
      if ( dlg.runMode == "batch-files" )
      {
         r = processBatchFiles( dlg.batchFiles, dlg.filterText, dlg.lightsFlatsOnly );
         batchTarget = "Selected files: " + dlg.batchFiles.length;
      }
      else
      {
         if ( batchDir.length == 0 )
         {
            logError( "Batch mode without target directory." );
            return;
         }

         r = processBatchDirectory( batchDir, dlg.filterText, dlg.lightsFlatsOnly );
         batchTarget = "Folder: " + batchDir;
      }

      var summary =
         "Batch completed.\n" +
         batchTarget + "\n" +
         "Total files: " + r.total + "\n" +
         "Successful: " + r.success + "\n" +
         "Skipped (not light/flat): " + r.skipped + "\n" +
         "Errors: " + r.failed;

      console.show();
      console.noteln( "[FilterZWOFit] " + summary.replace( /\n/g, " | " ) );

      (new MessageBox(
         summary,
         "FilterZWOFit",
         (r.failed > 0) ? StdIcon_Warning : StdIcon_Information,
         StdButton_Ok
      )).execute();

      return;
   }

   var w = ImageWindow.activeWindow;
   if ( w.isNull )
   {
      logError( "No active image window available for single mode." );
      (new MessageBox(
         "No active image window found.\nPlease open an image first or use batch mode.",
         "FilterZWOFit",
         StdIcon_Error,
         StdButton_Ok
      )).execute();
      return;
   }

   var action = upsertFilterKeyword( w, dlg.filterText );

   console.show();
   console.noteln( "FILTER " + action + ": " + dlg.filterText );

   (new MessageBox(
      "FILTER " + action + ": " + dlg.filterText,
      "FilterZWOFit",
      StdIcon_Information,
      StdButton_Ok
   )).execute();
}

main();

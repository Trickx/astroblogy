#engine v8
/*
   Temp4DarksMatter.js
   PixInsight 1.9.4 (PJSR) Feature Script:
   GUI tool to write the FILTER keyword in the FITS header,
   with single-image and batch processing modes.
*/
// Engine hint: prefer the PJSR engine on builds without legacy 'sm'.
#script-id     Temp4DarksMatter
#feature-id    Utilities > Temp4DarksMatter
#feature-info  Sets the FILTER value in the FITS header of the active image or in batch mode for a selected folder.
#feature-icon  Temp4DarksMatter.svg

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/DataType.jsh>

var DEBUG_ENABLED = true;
var SUPPORTED_IMAGE_EXTENSIONS = [ ".fit", ".fits", ".fts", ".xisf" ];
var SETTINGS_PREFIX = "Temp4DarksMatter";
var SETTINGS_KEY_LAST_BATCH_DIR = SETTINGS_PREFIX + "/LastBatchDirectory";
var SETTINGS_KEY_LAST_FILTER = SETTINGS_PREFIX + "/LastFilter";
var SETTINGS_KEY_FILTER_TEXT = SETTINGS_PREFIX + "/FilterText";

function logDebug( msg )
{
   if ( !DEBUG_ENABLED )
      return;
   console.show();
   console.noteln( "[Temp4DarksMatter][DEBUG] " + msg );
}

function logWarn( msg )
{
   console.show();
   console.warningln( "[Temp4DarksMatter][WARN] " + msg );
}

function logError( msg )
{
   console.show();
   console.criticalln( "[Temp4DarksMatter][ERROR] " + msg );
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

function listBatchFiles( directory )
{
   var files = [];
   var pattern = directory;
   if ( pattern.charAt( pattern.length-1 ) != '/' )
      pattern += "/";
   pattern += "*";

   var f = new FileFind;
   if ( f.begin( pattern ) )
   {
      do
      {
         if ( f.isDirectory )
            continue;

         var filePath = directory;
         if ( filePath.charAt( filePath.length-1 ) != '/' )
            filePath += "/";
         filePath += f.name;

         if ( isSupportedImageFile( filePath ) )
            files.push( filePath );
      }
      while ( f.next() );
   }

   return files;
}

function processBatchDirectory( directory, filterText )
{
   var files = listBatchFiles( directory );
   return processBatchFiles( files, filterText );
}

function processBatchFiles( files, filterText )
{
   logDebug( "Batch files found: " + files.length );

   var result = {
      total: files.length,
      success: 0,
      failed: 0
   };

   var i;
   for ( i = 0; i < files.length; ++i )
   {
      var filePath = files[i];
      logDebug( "Batch processing: " + filePath );

      var windows = null;
      try
      {
         windows = ImageWindow.open( filePath );
         if ( windows == null || windows.length < 1 )
            throw "File could not be opened.";

         var w = windows[0];
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

      this.windowTitle = "Temp4DarksMatter - Edit filter list";
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

      this.windowTitle = "Temp4DarksMatter - Set FILTER in FITS Header";
      this.filterText = "";
      this.filters = [];
      this.runMode = "single";
      this.batchDirectory = "";
      this.batchFiles = [];
      this.batchSelectionMode = "folder";
      this.lastBatchDirectory = readSettingString( SETTINGS_KEY_LAST_BATCH_DIR, File.currentWorkingDirectory );
      this.lastFilterValue = readSettingString( SETTINGS_KEY_LAST_FILTER, "" );

      this.helpLabel = new Label( this );
      this.helpLabel.useRichText = true;
      this.helpLabel.wordWrapping = true;
      var tooltipFromList = "Filter List: Select a filter loaded from your saved filter list.";
      var tooltipManual = "Filter String: Enter or edit the FILTER value that will be written to FITS headers.";
      var tooltipApply = "Apply: Write FILTER to the active image.";
      var tooltipBatch = "Batch...: Process all supported files from the selected folder or files.";
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
               "Temp4DarksMatter",
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
               "Temp4DarksMatter",
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
               "Temp4DarksMatter",
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
               "Temp4DarksMatter",
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
         r = processBatchFiles( dlg.batchFiles, dlg.filterText );
         batchTarget = "Selected files: " + dlg.batchFiles.length;
      }
      else
      {
         if ( batchDir.length == 0 )
         {
            logError( "Batch mode without target directory." );
            return;
         }

         r = processBatchDirectory( batchDir, dlg.filterText );
         batchTarget = "Folder: " + batchDir;
      }

      var summary =
         "Batch completed.\n" +
         batchTarget + "\n" +
         "Total files: " + r.total + "\n" +
         "Successful: " + r.success + "\n" +
         "Errors: " + r.failed;

      console.show();
      console.noteln( "[Temp4DarksMatter] " + summary.replace( /\n/g, " | " ) );

      (new MessageBox(
         summary,
         "Temp4DarksMatter",
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
         "Temp4DarksMatter",
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
      "Temp4DarksMatter",
      StdIcon_Information,
      StdButton_Ok
   )).execute();
}

main();

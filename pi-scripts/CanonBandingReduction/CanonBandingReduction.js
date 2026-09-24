#engine v8
CoreApplication.ensureMinimumVersion( 1, 9, 4 );

/*
   CanonBandingReduction.js v0.10.0
   Reduces Banding in Canon DSLR images.

   The problem has been discussed for example in http://tech.groups.yahoo.com/group/digital_astro/message/126102,
   cannot be fixed by image normalization with flats or darks, is not caused by problems in power supplies or
   electromagnetic noise, and affects different camera exemplars to differing extents.

   The general idea is to fix this by flattening the background looking at the median of each row. Additional
   tweaks try to avoid overcorrection caused by bright sections of the image. See BandingEngine.doit() for the details.

   This works very nicely for my Canon EOS40D. Let me know how it works for yours. Feel free to improve the script!

   Copyright (C) 2009-2013 Georg Viehoever

   This program is free software: you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation, version 3 of the License.

   This program is distributed in the hope that it will be useful, but WITHOUT
   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
   FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
   more details.

   You should have received a copy of the GNU General Public License along with
   this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
   Changelog:
   0.10.0: GUI rework:
         - preview is always active, "Activate Preview" checkbox removed
         - new "Fit" / "Zoom 1:1" button to scale the preview to the window
         - STF toggled by a button, highlighted while active
         - STF, zoom and new instance buttons moved into the OK/Cancel row
         - preview area enlarged to 720x480 (3:2), so 2:3 images fit without border
         - fixed display artifacts at the image border when fitting the preview
         - all parameters (amount, highlight protection, sigma, STF, zoom) persist between runs
         - default amount changed from 1.0 to 0.5
         - removed info box and version number from dialog
         - added SVG feature icon, script listed under Tricx
   0.9.1: Bugfix release:
         - Preview would not show in 1.8RC1 (ImageWindow() constructor now needs correct number of channels)
	 - STFs would accumulate. Related to Image.Assign() bug in 1.8RC3. Fixed with 1.8RC4
         - Preview did not STF images with 1 channel only (was always there - Canon RAWs always have 3 channels)
         - Saved sigma value was not correctly set in slider when Instance was recreated (was always there)
   0.9.0: Review and bugfix release:
         - removed bug in statistics computation. Only the global mean of R was computed correctly, sometimes resulting
           in a colour change of the fixed image.
         - removed wasting of memory: 64 bit images were used as intermediates even when 32 bit was sufficient. Should also
           improve performance.
         - changed normalization of fixed images: instead of using image.normalize, which changes the range covered by a
           dark image to cover the whole range from 0.0 to 1.0, I just clip values not to exceed this range. Should make postprocessing
           easier.
         - using fixed identifier ""tmpSTFWindow" for the hidden ImageWindow used by STF. Avoids use of "Image1", "Image2" etc.
         - added some comments
   0.8.0: Released as an official script with PI 1.5.9.
          Changes:
          - Instantiable script with the new Parameters interface. Can run on view and global
            contexts.
          - Several performance tweaks. The interface is now much more responsive. See the
            comment labeled IMPORTANT in BandingEngine.statusFunction(). More work is still
            needed in this regard.
          - There should be no memory problems thanks to PI 1.5.9 improvements and bug fixes.
   0.7.0: background processing, some performance tuning. Script is fit for general use, but
          still has the following problems:
          - works fine with image up to 1000x1000. Full Canon images (3700x2500) still cause
            memory overflows on my 2 GB windows laptop. The script uses *much* more memory
            than would be expected from the 116 MBytes required by a float format Canon imgage.
            Javascript issue?
          - it still needs a gc() in the paint method to avoid memory overflows, despite of jsAutoGC = true
          - generating the statistics (initally and when moving the protect highlights slider
            is relatively slow. Maybe need special line statistics functions?
          - occasionally, the GUI triggers recomputes when clicking on a new GUI element. Also,
            sliders sometimes start to move (magically) without user interaction, especially the
            SigmaFactor slider. This should not be the caee, and may be an Winodws event handling issue.
          - It can not be used in the context of Image Containers (like all scripts).
          - The experimental function "main1()" included below is intended to convert whole sets of files.
            It has the following problems:
            - excessive memory consumption, despite of use of some gc() tricks as suggested by Juan.
            - writing the processed image as ".fits" warns about "Corrupted shared image structure".
            - OpenFileDialog() apparently does not accept a pre-set filter.
          Any helpful comments are welcome.
   0.6.0: Changes for PI 1.5.6, preview with STF actually working thanks to JS fixes by Juan
   0.5.0: Changes for PI 1.5.2, version check, preview
   0.4.0: Added rejection of foreground pixels for median calculation. This is a variation of
          the ideas used by Jens Dierks in Fitswork (Flatten/Rows functionality). See
          http://freenet-homepage.de/JDierks/softw.htm for this useful software.
   0.3.0: Fixing all channels, automatic workaround for PI1.5 and earlier. First tested with 1.5.0
   0.2.0: Working processing as shown by Juan Conejero. Introduced
          elements from Niall Saunder's Debayer script (beta version)
   0.1.0: Initial version, modelled after Preview Allocator script provided with PixInsight
*/

// ----------------------------------------------------------------------------
// V8 PORT NOTICE
// ----------------------------------------------------------------------------
// Ported to PixInsight 1.9.4 V8 JavaScript engine by Peter Proulx
// (peterproulx@gmail.com), Masters of PixInsight (www.mastersofpixinsight.com)
// July 2026. Original script copyright remains with Georg Viehoever.
// No rights to the original work are claimed or implied.
//
// V8 changes: added #engine v8 directive and version guard; removed #include
// directives; converted BandingScrollControl to class extends ScrollBox and
// BandingDialog to class extends Dialog; expanded all with() statements;
// updated PJSR constants to dot notation (SampleType, ImageOp, UndoFlag,
// StdCursor, StdIcon, StdButton, FrameStyle); replaced processEvents() with
// CoreApplication.processEvents(); removed deprecated gc() and jsAutoGC.
// ----------------------------------------------------------------------------

// ======== #features ==============================================================

#script-id     CanonBandingReduction
#feature-id    Tricx > CanonBandingReduction

#feature-info \
Attempts to reduce the horizontal banding plaguing some Canon DSLRs.<br/>\
<br/>\
This script allows you to reduce the banding by equalizing horizontal background \
brightness.<br/>\
<br/>\
Copyright (C) 2009-2013 Georg Viehoever

#feature-icon  CanonBandingReduction.svg

// ========= # defines =============================================================

/// define for debugging output
#define DEBUGGING_MODE_ON false

#define TITLE   "CanonBandingReduction"
#define VERSION "0.10.0"
#define SETTINGS_KEY "CanonBandingReduction"

/// size of preview viewport in logical pixels. 3:2, so that a 2:3 image fits without border
#define PREVIEW_WIDTH  720
#define PREVIEW_HEIGHT 480


// include constants

/// @class Does the work using the params in data.
///
/// GUI functions are in a separate class, so this engine
/// can be used on its own. Use the different set..() function
/// to set the parameters, because these also schedule necessary recomputations.
/// Use getResult() to trigger processing and retrieve
/// result
function BandingEngine() {

   // init members
   this.targetImage=null;  // image to which operation is done
   this.convertedTargetImage=null;  // target image converted to float or doubles
   this.fixupImage=null;   // image that contains the fix values, assuming dAmount 1.0
   this.resultImage=null;  //result image

   //numeric params with their defaults
   this.dAmount=0.5; // image is fixed by adding fixImage*dAmount
   this.bDoHighlightProtect=false;  // toggle for protection from bright pixels
   this.dSigma=1.0;  //factor for sigma in hihglight protection

   /// retrieve settings from previous runs, stored in Parameters
   this.importParameters = function() {
      if ( Parameters.has( "amount" ) )
         this.dAmount = Parameters.getReal( "amount" );
      if ( Parameters.has( "highlightProtect" ) )
         this.bDoHighlightProtect = Parameters.getBoolean( "highlightProtect" );
      if ( Parameters.has( "sigma" ) )
         this.dSigma = Parameters.getReal( "sigma" );
   };

   /// retrieve settings persisted by previous runs of the dialog
   this.loadSettings = function() {
      var value = Settings.read( SETTINGS_KEY + "/amount", DataType.Double );
      if ( Settings.lastReadOK )
         this.dAmount = value;
      value = Settings.read( SETTINGS_KEY + "/highlightProtect", DataType.Boolean );
      if ( Settings.lastReadOK )
         this.bDoHighlightProtect = value;
      value = Settings.read( SETTINGS_KEY + "/sigma", DataType.Double );
      if ( Settings.lastReadOK )
         this.dSigma = value;
   };

   /// persist current settings for later runs of the dialog
   this.saveSettings = function() {
      Settings.write( SETTINGS_KEY + "/amount", DataType.Double, this.dAmount );
      Settings.write( SETTINGS_KEY + "/highlightProtect", DataType.Boolean, this.bDoHighlightProtect );
      Settings.write( SETTINGS_KEY + "/sigma", DataType.Double, this.dSigma );
   };

   /// Store current settings for use with later runs.
   this.exportParameters = function() {
      Parameters.set( "amount", this.dAmount );
      Parameters.set( "highlightProtect", this.bDoHighlightProtect );
      Parameters.set( "sigma", this.dSigma );
   };

   // flags to show if something needs to be recomputed. Managed by set...() and do...() functions
   this.bRedoConvert=true;
   this.bRedoStatistics=true;
   this.bRedoResult=true;

   /// function to set new target image
   this.setTargetImage=function(targetImage){
      if (this.targetImage!=targetImage){
         if ( DEBUGGING_MODE_ON ){
            Console.writeln("Setting targetImage=",targetImage);
         }
         this.targetImage=targetImage;
         this.bRedoConvert=true;
         this.bRedoStatistics=true;
         this.bRedoResult=true;
      }  //if setting changed
   };  //setTargetImage()

   /// function to set new amount value
   this.setAmount=function(amountValue){
      if (this.dAmount!=amountValue){
         this.dAmount=amountValue;
         this.bRedoResult=true;
      }  //if setting changed
   };  //setAmount()

   /// function to set highlightProtect mode
   this.setHighlightProtect=function(doHighlightProtect,sigmaValue){
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("SetHighlightProtect=",doHighlightProtect,sigmaValue);
      }
      if((this.bDoHighlightProtect!=doHighlightProtect)||
         (doHighlightProtect &&(this.dSigma!=sigmaValue))){
         //something relevant changed
         this.bDoHighlightProtect=doHighlightProtect;
         this.dSigma=sigmaValue;
         this.bRedoStatistics=true;
         this.bRedoResult=true;
      }  //if changed
   };  //setHighlightProtect()

   /// set status function that is called by time consuming operations for progress reporting and cancel query
   ///
   /// Operations include the image statistics and the actual correction. Can be used for progress reporting and canceling long operations.
   /// @param statusFunction is a function that receives a string (that can be displayed somewhere)
   ///        and that returns a boolean. The boolean is true if operation can continue, if false
   ///        the opertion is aborted ASAP. bForceUpdate can be used to force a GUI update.
   ///        If ==null, a default function doing nothing is set.
   this.setStatusFunction=function(statusFunction) {
      if (statusFunction==null){
         // set default doing nothing
         this.statusFunction=function(statusString,bForceUpdate) {
            if ( DEBUGGING_MODE_ON ){
               Console.writeln("statusFunction, string=",statusString, "bForceUpdate=",bForceUpdate);
            }
            return true;
         }  //statusFunction()
      }else{
         this.statusFunction=statusFunction;
      }
   };  //function setStatusFunction()

   // set default status function
   this.setStatusFunction(null);

   /// function converts target image to float type if necessary
   this.doConvertImage=function(){
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.doConvertImage(), targetImage=",this.targetImage);
      }
      if(!this.statusFunction("Converting image to float type",true)) return;

      if (this.bRedoConvert){
         if (this.targetImage.isNull){
            if ( DEBUGGING_MODE_ON ){
               Console.writeln("doConvertImage(). targetImage is null");
            }
            this.convertedImage=null;
         }else{
            // convert image to floating point format, since int would not handle negatives or overflows
            if ( this.targetImage.sampleType == 0 ){
               this.convertedImage = new Image( this.targetImage.width, this.targetImage.height,
                                 this.targetImage.numberOfChannels, this.targetImage.colorSpace,
                                 (this.targetImage.bitsPerSample < 32) ? 32 : 64, 1 );
               this.targetImage.resetSelections();
               this.convertedImage.resetSelections()
               this.convertedImage.assign( this.targetImage );
            }else{
               // no conversion required
               this.targetImage.resetSelections();
               this.convertedImage=this.targetImage;
            }  //if conversion necessary
         }  //if target=null
         this.bRedoConvert=false;
         this.statusFunction("Conversion done",true);
      }  // if redoConvert
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.doConvertImage() done");
      }
   };  //convertImage()

   /// do statistics and medians if necessary. Create fixImage.
   this.doStatistics=function(){
      if ( DEBUGGING_MODE_ON ){
         var now=Date.now();
         Console.writeln("BandingEngine.doStatistics()");
      }
      if (this.bRedoStatistics){
         this.doConvertImage();
         var targetImage=this.convertedImage;
         if (targetImage.isNull) return;

         this.fixImage=new Image( targetImage.width, targetImage.height,
                                 targetImage.numberOfChannels, targetImage.colorSpace,
                                 targetImage.bitsPerSample, 1 );
         var fixImage=this.fixImage;
         targetImage.resetSelections();
         fixImage.resetSelections();

         var targetHeight=targetImage.height;
         var targetWidth=targetImage.width;
         // for each channel, determine global statistics (average, deviation).
         // for each line, determine line average (bounded by possible highlight protection).
         for (var chan=0; chan<targetImage.numberOfChannels;++chan){
            targetImage.resetSelections();
            targetImage.selectedChannel=chan;
            fixImage.selectedChannel=chan;

            var rGBGlobalMedian=targetImage.median();
            //estimate noise
            //var globalSigma=targetImage.stdDev();
            //According to  http://en.wikipedia.org/wiki/Median_absolute_deviation,
            //this is a more robust estimator for sigma than stdDev(). Inspection of typical
            //images appears to confirm that.
            // FIXME maybe use new noise estimate functionality as used by imageIntegration.
            var dGlobalSigma=1.4826*targetImage.avgDev();

            // construct rejection threshold for highlight protection
            var rejectionHigh = this.bDoHighlightProtect ?
               rGBGlobalMedian + this.dSigma * dGlobalSigma : 1.0;

            //now determine the medians for each row.
            var lineRect=new Rect(targetWidth,1);
            for (var row=0; row<targetHeight;++row) {
               var statusString="Computing statistics for channel "+chan+", row "+row;
               if(!this.statusFunction(statusString,false)) {
                  return;
               }
               lineRect.moveTo(0,row);
               targetImage.selectedRect=lineRect;
               fixImage.selectedRect=lineRect;

               var rGBRowMedian;
               if ( this.bDoHighlightProtect ) {
                  // For highlight protection, get samples for this row, clamp bright
                  // pixels to the rejection threshold, then take the median.
                  var rowSamples = [];
                  targetImage.getSamples( rowSamples );
                  var clipped = rowSamples.filter( function(v) { return v <= rejectionHigh; } );
                  if ( clipped.length > 0 ) {
                     clipped.sort( function(a,b) { return a - b; } );
                     var mid = Math.floor( clipped.length / 2 );
                     rGBRowMedian = (clipped.length % 2 !== 0) ? clipped[mid] :
                                    (clipped[mid-1] + clipped[mid]) / 2;
                  } else {
                     rGBRowMedian = targetImage.median();
                  }
               } else {
                  rGBRowMedian = targetImage.median();
               }
               // store fix factor into fixImage
               var fixFactor=rGBGlobalMedian-rGBRowMedian;
               fixImage.fill(fixFactor);  //much faster than apply()!
            }  // for row
         }  //for channel


         targetImage.resetSelections();
         fixImage.resetSelections();
         this.bRedoStatistics=false;

         // if you are interested in seeing the image used for fixing the banding, replace
         // the false with true. Note that you can no longer use it for fixing due to the
         // fixImage.normalize();
         if ( false ){
            fixImage.normalize();
            var wtmp = new ImageWindow( 1000, 1000, 3,
                                 fixImage.bitsPerSample, fixImage.sampleType == 1, fixImage.isColor,"FixImage" );
            var v = wtmp.mainView;

            v.beginProcess( UndoFlag.NoSwapFile );
            v.image.assign( fixImage );
            v.endProcess();
            wtmp.bringToFront();
         }

         this.statusFunction("Statistics done",true)
      }  // if RedoStatistics
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.doStatistics() done");
         Console.writeln("BandingEngine.doStatistics() required time [ms]=",Date.now()-now);
      }
   };  //doStatistics()

   /// compute the result, doing only the necessary recomputations.
   this.doResult=function(){
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.doResult()");
      }
      if (this.bRedoResult){
         this.doStatistics();
         var targetImage=this.convertedImage;
         if (targetImage.isNull) return;

         if(!this.statusFunction("Fixing image",true)) {
            return;
         }
         this.resultImage=new Image( targetImage.width, targetImage.height,
                                 targetImage.numberOfChannels, targetImage.colorSpace,
                                 targetImage.bitsPerSample, 1 );
         targetImage.resetSelections();
         var resultImage=this.resultImage;
         this.fixImage.resetSelections();
         resultImage.resetSelections();
         resultImage.assign(this.fixImage);
         var dAmount=this.dAmount;
         resultImage.apply(dAmount,ImageOp.Mul);
         resultImage.apply(targetImage,ImageOp.Add);
         // if necessary: rescale data into range from 0.0-1.0
         if(!this.statusFunction("Normalizing image",true)) return;

         //resultImage.normalize();
         //I dont want a normalization here, since this drastically changes the range of the original image.
         //I just clip the values between 0.0 and 1.1.
         var clipImage=new Image( targetImage.width, targetImage.height,
                                 targetImage.numberOfChannels, targetImage.colorSpace,
                                 targetImage.bitsPerSample, 1 );
         clipImage.fill(0.0);
         resultImage.apply(clipImage,ImageOp.Max);
         clipImage.fill(1.0);
         resultImage.apply(clipImage,ImageOp.Min);
         this.statusFunction("Fixing image done",true);
         this.bRedoResult=false;
      }  //if RedoResult
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.doResult() done");
      }
   };  //doResult()

   /// get the current result, doing recomputations if necessary
   this.getResult=function(){
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.getResult()");
      }
      this.doResult();
      if(!this.statusFunction("Preview updated",true)){
         this.statusFunction("Preview update aborted",true);
      }
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.getResult() done");
      }
      return this.resultImage;
   };  //getResult()

   // get the last computed result. If there is no valid result,
   // return null. No recompute is done, even if it would be necessary
   this.getLastResult=function(){
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.getLastResult()");
      }
      return this.resultImage;
      var result=null;
      if (!this.bRedoResult){
         result=this.getResult();
      }
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("BandingEngine.getLastResult() done");
      }
      return result;
   };  // function getLastResult()

   /// do the actual work on target view
   this.doit=function(targetView){
      this.doResult();
      // Tell the core application that we are going to change this view.
      // Without doing this, we'd have just read-only access to the view's image.
      targetView.beginProcess();
      targetView.image.resetSelections();
      targetView.image.assign( this.resultImage );
      // end transaction
      targetView.endProcess();
    };   //function doit
}  //class BandingEngine

/// @class embedded preview for dialog.
///
/// use doUpdateImage() to set displayed image and STF.
/// largely based on code provided by Juan.
class BandingScrollControl extends ScrollBox
{
constructor( parent )
{
   super( parent );

   this.autoScroll = true;
   this.tracking = true;

   this.displayImage=null;
   this.fitToWindow=false;
   this.scaledBitmap=null;   // cached bitmap for fit-to-window mode
   this.dragging = false;
   this.dragOrigin = new Point( 0 );

   this.viewport.cursor = new Cursor( StdCursor.OpenHand );

   /// apply stf to image and return image
   /// code as per Juan
   this.applySTF=function( img, stf )
   {
      var HT = new HistogramTransformation;
      if(img.numberOfChannels!=1){
         HT.H = [[stf[0][1], stf[0][0], stf[0][2], stf[0][3], stf[0][4]],
              [stf[1][1], stf[1][0], stf[1][2], stf[1][3], stf[1][4]],
              [stf[2][1], stf[2][0], stf[2][2], stf[2][3], stf[2][4]],
              [ 0, 0.5, 1, 0, 1]];
      } else {
         HT.H = [[ 0, 0.5, 1, 0, 1],
                 [ 0, 0.5, 1, 0, 1],
                 [ 0, 0.5, 1, 0, 1],
                 [stf[0][1], stf[0][0], stf[0][2], stf[0][3], stf[0][4]]];
      }

      var wtmp = new ImageWindow( 1, 1, img.numberOfChannels,
         img.bitsPerSample, img.sampleType == 1, img.isColor, "tmpSTFWindow" );
      var v = wtmp.mainView;

      v.beginProcess( UndoFlag.NoSwapFile );
      v.image.assign( img );
      v.endProcess();

      HT.executeOn( v, false ); // no swap file
      var image=v.image;
      var result=new Image( image.width, image.height,
                            image.numberOfChannels, image.colorSpace,
                            image.bitsPerSample, image.sampleType);
      result.assign(v.image);
      wtmp.forceClose();
      return result;
   };
   /// get current result image. May be null
   this.getImage=function(){
      return this.displayImage;
   };  //getImage()

   /// called to notify that a redraw of image is necessary with given image
   /// @param image: Image to be displayed
   /// @param stf: Screen transfer function to be applied. Can be null.
   this.doUpdateImage=function(image,stf){
      if (stf==null){
         this.displayImage=image;
      }else{
         this.displayImage=this.applySTF(image,stf)
      }
      this.scaledBitmap=null;
      this.initScrollBars();
      this.viewport.update(); // trigger initial display
   };  // doUpdateImage()

   /// switch between 1:1 display and display scaled to fit the viewport
   this.setFitToWindow=function(fit){
      this.fitToWindow=fit;
      this.initScrollBars();
      this.viewport.repaint();
   };  // setFitToWindow()

   /// get bitmap of current image scaled to fit the viewport. May be null
   this.getScaledBitmap=function(){
      var image=this.getImage();
      if (image==null){
         return null;
      }
      if (this.scaledBitmap==null){
         var scale=Math.min( this.viewport.width/image.width,
                             this.viewport.height/image.height, 1.0 );
         var bitmap=image.render();
         if (scale<1.0){
            var w=Math.max( 1, Math.round( image.width*scale ) );
            var h=Math.max( 1, Math.round( image.height*scale ) );
            bitmap=bitmap.scaledTo( w, h );
         }
         this.scaledBitmap=bitmap;
      }
      return this.scaledBitmap;
   };  // getScaledBitmap()

   this.initScrollBars = function(){
      this.prevX = 0;
      this.prevY = 0;
      this.scaledBitmap=null;
      var image=this.getImage();
      if (image==null || this.fitToWindow){
         //nothing to draw...
         this.pageWidth=0;
         this.pageHeight=0;
         this.setHorizontalScrollRange(0,0);
         this.setVerticalScrollRange(0,0);
      }else{
         //we do have an image, so use its values
         this.pageWidth=image.width;
         this.pageHeight=image.height;
         this.setHorizontalScrollRange( 0, Math.max( 0, this.pageWidth - this.viewport.width ) );
         this.setVerticalScrollRange( 0, Math.max( 0, this.pageHeight - this.viewport.height ) );
      }
      // always repaint the whole viewport: in fit-to-window mode, the scaled
      // bitmap and its position change with every resize
      this.viewport.update();
   };  // initScrollBars()

   this.viewport.onResize = function()
   {
      this.parent.initScrollBars();
   };  //onResize()

   this.onHorizontalScrollPosUpdated = function( x )
   {
      this.viewport.update();
   };  //onHorizontalScrollPosUpdated()

   this.onVerticalScrollPosUpdated = function( y )
   {
      this.viewport.update();
   };  // onVerticalScrollPosUpdated()

   this.viewport.onMousePress = function( x, y, button, buttons, modifiers )
   {
      this.cursor = new Cursor( StdCursor.ClosedHand );
      this.parent.dragOrigin.x = x;
      this.parent.dragOrigin.y = y;
      this.parent.dragging = true;
   }; // onMousePress()

   this.viewport.onMouseMove = function( x, y, buttons, modifiers )
   {
         if ( this.parent.dragging )
         {
            this.parent.scrollPosition = new Point( this.parent.scrollPosition ).translatedBy( this.parent.dragOrigin.x-x, this.parent.dragOrigin.y-y );
            this.parent.dragOrigin.x = x;
            this.parent.dragOrigin.y = y;
         }
   }; // onMouseMove()

   this.viewport.onMouseRelease = function( x, y, button, buttons, modifiers )
   {
      this.cursor = new Cursor( StdCursor.OpenHand );
      this.parent.dragging = false;
   }; // onMouseRelease()

   this.viewport.onPaint = function( x0, y0, x1, y1 )
   {
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("onPaint() entry");
      }
      var g = new Graphics( this );
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("onPaint() calling getImage()");
      }
      var result=this.parent.getImage();
      if ( DEBUGGING_MODE_ON ){
        Console.writeln("onPaint() getImage() returned");
      }
      if (result==null){
         // no current image, just draw a red background
         g.fillRect( x0, y0, x1, y1, new Brush( 0xffff0000 ) );
      }else if (this.parent.fitToWindow){
         // draw scaled image centered in viewport
         var bitmap=this.parent.getScaledBitmap();
         g.fillRect( x0, y0, x1, y1, new Brush( 0xff202020 ) );
         g.drawBitmap( Math.floor( (this.width-bitmap.width)/2 ),
                       Math.floor( (this.height-bitmap.height)/2 ), bitmap );
      }else{
         result.selectedRect = (new Rect( x0, y0, x1, y1 )).translated( this.parent.scrollPosition );
         g.drawBitmap( x0, y0, result.render() );
         result.resetRectSelection();
      }
      g.end();
      // do garbage collect. Otherwise system eats memory until it comes to a halt
      // when I scroll the preview
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("onPaint() exit");
      }
   }; //onPaint()

   this.initScrollBars();
}  //constructor
}  //class BandingScrollControl

/// @class GUI dialog for getting params and starting process
///
/// @param bandingEngine: The engine for transforming the image
/// @param targetView: view to which operation is applied
class BandingDialog extends Dialog
{
constructor(bandingEngine,targetView)
{
   super();

   // used later in functions not called by local object to reference this.
   // this in function calls is always the calling object.
   var my=this;

   this.bandingEngine=bandingEngine;
   this.targetView=targetView;

   //init values
   this.previewWithSTF=false;
   var withSTF=Settings.read( SETTINGS_KEY + "/previewWithSTF", DataType.Boolean );
   if ( Settings.lastReadOK )
      this.previewWithSTF=withSTF;

   // management of generatePreview() background jobs.
   // construct as suggested by Juan
   this.terminate=false;   // true if no further generate is required
   this.abort=false; // true if there is a new job
   this.busy=false;  // true if a generate is running

   this.lastCallTime=Date.now(); // saves the time for last progress report, used in statusFunction()

   var labelWidth1 = this.font.width( 'T' + "" );

   // target view selection, defaults to the active view
   this.targetViewLabel=new Label(this);
   this.targetViewLabel.text="Target view:";

   this.targetViewList=new ViewList(this);
   this.targetViewList.getAll();
   this.targetViewList.currentView=this.targetView;
   this.targetViewList.toolTip="<p>Select the image to be corrected.</p>";
   this.targetViewList.onViewSelected=function(view){
      if (view.isNull){
         // keep the previous target, there always has to be one
         this.currentView=this.dialog.targetView;
         return;
      }
      if (view.fullId==this.dialog.targetView.fullId) return;
      this.dialog.targetView=view;
      this.dialog.bandingEngine.setTargetImage(view.image);
      this.dialog.generatePreview();
   }; //onViewSelected()

   // amount slider
   this.amountControl=new NumericControl(this);
   this.amountControl.label.text = "Amount:";
   this.amountControl.label.minWidth = labelWidth1;
   this.amountControl.setRange( 0, 4.0 );
   this.amountControl.slider.setRange( 0, 1000 );
   this.amountControl.slider.scaledMinWidth = 250;
   this.amountControl.setPrecision( 2 );
   this.amountControl.setValue( this.bandingEngine.dAmount);
   this.amountControl.toolTip = "<p>Define the amount of correction.</p>";
   this.amountControl.onValueUpdated = function( value ) {
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("processing in slider, amount=",value);
      }
      this.dialog.bandingEngine.setAmount(value);
      this.dialog.generatePreview();
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("processing in slider, amount=",value, "done");
      }
      return;
   }; //function onValueUpdated();

   // protect from highlights checkbox and slider
   this.highlightProtectCheckbox=new CheckBox(this);
   this.highlightProtectCheckbox.text = "Protect from Highlights";
   this.highlightProtectCheckbox.toolTip ="<p>Ignore bright pixels when correcting.</p>";
   this.highlightProtectCheckbox.checked=this.bandingEngine.bDoHighlightProtect;
   this.highlightProtectCheckbox.onCheck = function(checked){
      this.dialog.sigmaControl.enabled=checked;
      this.dialog.bandingEngine.setHighlightProtect(checked,this.dialog.bandingEngine.dSigma);
      this.dialog.generatePreview();
   }; //onCheck()

   this.sigmaControl=new NumericControl(this);
   this.sigmaControl.label.text = "1/SigmaFactor:";
   this.sigmaControl.label.minWidth = labelWidth1;
   this.sigmaControl.setRange( 0.01, 5 );
   this.sigmaControl.slider.setRange( 0, 1000 );
   this.sigmaControl.slider.scaledMinWidth = 250;
   this.sigmaControl.setPrecision( 2 );
   this.sigmaControl.setValue( 1.0/this.bandingEngine.dSigma );
   this.sigmaControl.enabled=this.bandingEngine.bDoHighlightProtect;
   this.sigmaControl.toolTip = "<p>Background for lines is computed using pixels in " +
                "[SigmaFactor*StdDev] only. Higher values give higher protection.</p>";
   this.sigmaControl.onValueUpdated = function( value ) {
      this.dialog.bandingEngine.setHighlightProtect(this.dialog.bandingEngine.bDoHighlightProtect,
                                       1.0/value);
      this.dialog.generatePreview();
      return;
   }; //function onValueUpdated();

   // STF button and preview control
   this.stf_Button=new PushButton(this);
   this.stf_Button.text="STF";
   this.stf_Button.toolTip="<p>Toggle display of preview with current STF.</p>";
   this.stf_Button.checkable=true;
   this.stf_Button.autoExclusive=false;
   this.stf_Button.onClick=function(){
      this.dialog.previewWithSTF=!this.dialog.previewWithSTF;
      this.dialog.updateSTFButton();
      this.dialog.generatePreview();
   }  //onClick()
   this.updateSTFButton=function(){
      this.stf_Button.checked=this.previewWithSTF;
      // highlight button while STF is active
      this.stf_Button.styleSheet=this.previewWithSTF ? "background: #555a60; color: #f0f0f0;" : "";
   }  //updateSTFButton()
   this.updateSTFButton();

   this.previewControl=new BandingScrollControl(this);
   this.previewControl.setScaledMinSize( PREVIEW_WIDTH, PREVIEW_HEIGHT );
   var fitToWindow=Settings.read( SETTINGS_KEY + "/fitToWindow", DataType.Boolean );
   if ( Settings.lastReadOK )
      this.previewControl.fitToWindow=fitToWindow;

   // fit to window button
   this.fitToWindow_Button=new PushButton(this);
   this.fitToWindow_Button.toolTip="<p>Toggle between scaling the preview to fit " +
      "the window and displaying it at 1:1.</p>";
   this.fitToWindow_Button.onClick=function(){
      var previewControl=this.dialog.previewControl;
      previewControl.setFitToWindow(!previewControl.fitToWindow);
      this.dialog.updateFitToWindowButton();
   }  //onClick()
   this.updateFitToWindowButton=function(){
      this.fitToWindow_Button.text=this.previewControl.fitToWindow ? "Fit" : "Zoom 1:1";
   }  //updateFitToWindowButton()
   this.updateFitToWindowButton();

   /// persist current settings of engine and dialog for later runs
   this.saveSettings=function(){
      this.bandingEngine.saveSettings();
      Settings.write( SETTINGS_KEY + "/previewWithSTF", DataType.Boolean, this.previewWithSTF );
      Settings.write( SETTINGS_KEY + "/fitToWindow", DataType.Boolean, this.previewControl.fitToWindow );
   }  //saveSettings()

   // New Instance button
   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 20, 20 );
   this.newInstance_Button.toolTip = "<p>New Instance</p>"
      + "<p>Drag this icon to the workspace to create a process icon. Then close this dialog "
      + "and drag the process icon onto an image.</p>"
      + "<p>Dropping it directly onto an image while this dialog is open does not work, "
      + "because PixInsight cannot run a script while another script is running.</p>";
   this.newInstance_Button.onMousePress = function(){
      this.hasFocus = true;
      this.pushed = false;
      this.dialog.bandingEngine.exportParameters();
      this.dialog.newInstance();
   };

   // ok and cancel buttons
   this.ok_Button = new PushButton (this);
   this.ok_Button.text = "Apply";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.toolTip="<p>Apply current settings to target image and close.</p>"
   this.ok_Button.onClick = function() {
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("ok_Button.onClick()");
      }  // if debugging
         // ok selected
        this.dialog.bandingEngine.doit(this.dialog.targetView);
        this.dialog.ok();
   };

   this.cancel_Button = new PushButton (this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.toolTip="<p>Close without applying current settings to target.</p>"
   this.cancel_Button.onClick = function() {
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("cancel_Button.onClick()");
      }  // if debugging
      this.dialog.cancel();
   };

   // text label used for progress reporting
   this.infoLabel = new Label( this );
   this.infoLabel.toolTip="<p>Progress reporting</p>"
      this.infoLabel.frameStyle = FrameStyle.Box;
      this.infoLabel.margin = 4;
      this.infoLabel.text = "";
   // items for progress reporting
   // update text of info label
   this.setInfoLabel=function(text) {
      this.infoLabel.text="Status: "+text
   }  //setInfoLabel()
   this.setInfoLabel("");

   // progress reporting and job management

   /// callback function for engine, doing progress reporting and cancel processing
   this.statusFunction=function(statusString,bForceUpdate) {
      var currentCallTime=Date.now();
      // note: my is necessary here, because "this" is the caller!
      if (((currentCallTime-my.lastCallTime)>250) || bForceUpdate) {
         // do this only every 0.1 sec to save unnecessary overhead.
         my.lastCallTime=Date.now();
         my.setInfoLabel(statusString);
      }
      CoreApplication.processEvents();  // ### IMPORTANT: processEvents() must be called frequently
                        //                for the GUI to become responsive during
                        //                intensive calculations.
      return !my.abort;
   }  //statusFunction()
   this.bandingEngine.setStatusFunction(this.statusFunction);

   /// generate preview with new settings. If already a generate is running,
   /// cancel it and return. The already running generate will then take care of
   /// the new settings
   this.generatePreview=function(){
      // If we are already generating data, request job abortion and return.
      if ( this.busy )
      {
         // tells already running computation to abort, and to pick up the new params for computation
         this.abort = true;
         // leave processing with current settings to the already running generate()
         return;
      }
      // Start of job
      this.busy = true;
      do
      {
         // if we have been aborted, we pick up the new job params and do it
         this.abort = false;
         // trigger recompute
         var image=this.bandingEngine.getResult();
         var stf=null;
         if (this.previewWithSTF){
            stf=this.targetView.stf;
         }
         this.previewControl.doUpdateImage(image,stf);
      }
      while ( this.abort && !this.terminate );
      // at this point, the processing has not been aborted, or the whole process
      // is terminating
      this.busy=false;
      if ( DEBUGGING_MODE_ON ){
         Console.writeln("generatePreview(): Finished for Amount=",this.bandingEngine.dAmount);
      }
   }  //function generatePreview()

   // tell generatePreview to terminate processing()
   this.terminateGeneratePreview=function() {
      this.terminate=true;
   }


   // PACK EVERYTHING INTO LAYOUT
   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 4;
   this.buttons_Sizer.add (this.newInstance_Button);
   this.buttons_Sizer.add (this.stf_Button);
   this.buttons_Sizer.add (this.fitToWindow_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add (this.targetViewLabel);
   this.buttons_Sizer.add (this.targetViewList);
   this.buttons_Sizer.addSpacing (8);
   this.buttons_Sizer.add (this.ok_Button);
   this.buttons_Sizer.add (this.cancel_Button);

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add (this.amountControl);
   this.sizer.addSpacing (4);
   this.sizer.add (this.highlightProtectCheckbox);
   this.sizer.addSpacing (4);
   this.sizer.add (this.sigmaControl);
   this.sizer.addSpacing (4);
   this.sizer.add (this.buttons_Sizer);
   this.sizer.add(this.infoLabel);
   this.sizer.addSpacing (4);
   this.sizer.add (this.previewControl);

   this.windowTitle = TITLE;
   this.adjustToContents();

   /// enlarge preview by the frame of the scroll box, so that the viewport
   /// itself has the size PREVIEW_WIDTH x PREVIEW_HEIGHT
   this.onShow=function(){
      var previewControl=this.previewControl;
      // measure without scroll bars
      previewControl.setHorizontalScrollRange(0,0);
      previewControl.setVerticalScrollRange(0,0);
      CoreApplication.processEvents();
      var frameWidth=previewControl.width-previewControl.viewport.width;
      var frameHeight=previewControl.height-previewControl.viewport.height;
      previewControl.setMinSize( this.logicalPixelsToPhysical( PREVIEW_WIDTH )+frameWidth,
                                 this.logicalPixelsToPhysical( PREVIEW_HEIGHT )+frameHeight );
      previewControl.initScrollBars();
      this.adjustToContents();
   }  //onShow()

   // finally update the Preview
   this.generatePreview();

}  //constructor
}  //class BandingDialog


function main() {

   if ( DEBUGGING_MODE_ON ){
      Console.show();
      Console.writeln("Canon Banding Script started");
   }
   // allow stop
   Console.abortEnabled = true;
   //enable automatic garbage collect

   if ( DEBUGGING_MODE_ON ){
      Console.writeln("Version Info:", coreId,",",coreVersionBuild,",",coreVersionMajor,
                      ",", coreVersionMinor,",",coreVersionRelease);
      Console.writeln ("Dialog opening");
   }  // if debug mode

   // works only with PI 1.5.6 (build 525) or later

   var bandingEngine=new BandingEngine();
   // settings from previous runs; overridden by parameters of a script instance
   bandingEngine.loadSettings();

   if ( Parameters.isGlobalTarget || Parameters.isViewTarget )
   {
      //
      // ### The script is being executed as a Script instance.
      //
      bandingEngine.importParameters();
   }

   if ( Parameters.isViewTarget )
   {
      //
      // ### The script is being executed on a target view
      //
      bandingEngine.setTargetImage(Parameters.targetView.image);
      bandingEngine.doit(Parameters.targetView);
   }
   else
   {
      //
      // ### The script is being executed either in the direct or global context.
      //
      var window = ImageWindow.activeWindow;
      if ( window.isNull ){
         var msg = new MessageBox(
         "<p>No active window. Terminating script.</p>",
         TITLE, StdIcon.Warning, StdButton.Ok);
         msg.execute();
         throw new Error( "No active window" );
      }
      if ( window.currentView.isNull ){ // ### This cannot happen - but testing doesn't hurt ;)
         var msg = new MessageBox(
         "<p>No active image. Terminating script.</p>",
         TITLE, StdIcon.Warning, StdButton.Ok);
         msg.execute();
         throw new Error("No active image");
      }
      var targetView=window.currentView;
      bandingEngine.setTargetImage(targetView.image);
      var dialog = new BandingDialog(bandingEngine,targetView);
      dialog.execute();
      dialog.saveSettings();
   }

   if ( DEBUGGING_MODE_ON ){
      Console.writeln("Canon Banding Script done");
      Console.hide();
   }
}  //main()


// For processing large sets of images, please use Image Container
main();

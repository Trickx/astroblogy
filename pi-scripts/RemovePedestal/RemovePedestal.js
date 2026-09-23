// ============================================================================
// RemovePedestal.js  -  PixInsight 1.9.x (PJSR / V8)
// ----------------------------------------------------------------------------
// Port of the "Remove Pedestal" tool from Seti Astro Suite Pro (SASpro)
//   original: setiastro/setiastrosuitepro  src/setiastro/saspro/pedestal.py
//   (c) Franklin Marek, GPL-3.0
// This port is likewise released under the GNU GPL v3.
// SPDX-License-Identifier: GPL-3.0-only
//
// Subtracts a pedestal (constant offset) from the image:
//   * Image minimum         - classic; removes the darkest value per channel
//   * Low percentile (Pxx)  - ignores a few grossly-low cold pixels
//   * First non-zero value  - smallest value > 0 (data on a hard zero floor)
// Per-channel (RGB) or one global value. Result is clipped to [0,1].
//
// The subtraction is executed through PixelMath, so masks, undo/redo and
// the processing history work as usual. Supports process icons
// (new instance triangle) and drag & drop of the icon onto an image.
// ============================================================================

#script-id     RemovePedestal
#feature-id    Trickx > RemovePedestal
#feature-info  Subtracts a pedestal (image minimum, low percentile or first \
               non-zero value) per channel or globally. Port of Remove \
               Pedestal from Seti Astro Suite Pro.
#feature-icon  RemovePedestal.svg

#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/TextAlign.jsh>

#define TITLE   "Remove Pedestal"
#define VERSION "1.0.0"

// Target median of the preview-only auto display stretch (as in SASpro)
#define DISPLAY_TARGET_MEDIAN 0.25
// Histogram resolution for exact order statistics (2^20 bins)
#define HIST_BINS 1048576

var MODES       = [ "min", "percentile", "first_nonzero" ];
var MODE_LABELS = [ "Image minimum", "Low percentile (P%PCT%)", "First non-zero value" ];

// ----------------------------------------------------------------------------
// Parameters (process icon support)
// ----------------------------------------------------------------------------
function PedestalParameters()
{
   this.mode        = "min";
   this.pct         = 0.1;     // percent
   this.perChannel  = true;
   this.autoStretch = true;

   this.save = function()
   {
      Parameters.set( "mode", this.mode );
      Parameters.set( "pct", this.pct );
      Parameters.set( "perChannel", this.perChannel );
      Parameters.set( "autoStretch", this.autoStretch );
   };

   this.load = function()
   {
      if ( Parameters.has( "mode" ) )
      {
         var m = Parameters.getString( "mode" );
         if ( MODES.indexOf( m ) >= 0 )
            this.mode = m;
      }
      if ( Parameters.has( "pct" ) )
         this.pct = Math.max( 0, Math.min( 50, Parameters.getReal( "pct" ) ) );
      if ( Parameters.has( "perChannel" ) )
         this.perChannel = Parameters.getBoolean( "perChannel" );
      if ( Parameters.has( "autoStretch" ) )
         this.autoStretch = Parameters.getBoolean( "autoStretch" );
   };
}

var params = new PedestalParameters;

// ----------------------------------------------------------------------------
// Analyzer: statistics of the target view (exact, full resolution)
// ----------------------------------------------------------------------------
function PedestalAnalyzer( view, previewMaxDim )
{
   var image = view.image;
   this.view = view;
   this.w  = image.width;
   this.h  = image.height;
   this.nc = image.numberOfNominalChannels;   // alpha channels are ignored
   this.n  = this.w * this.h;

   var rect = new Rect( this.w, this.h );
   var buf  = new Float32Array( this.n );

   // Loads one channel into the shared buffer (keeps memory at one channel)
   this.load = function( c )
   {
      image.getSamples( buf, rect, c );
      return buf;
   };

   // Preview geometry (nearest-neighbour decimation)
   var s = Math.max( 1, Math.ceil( Math.max( this.w, this.h ) / previewMaxDim ) );
   this.pw = Math.ceil( this.w / s );
   this.ph = Math.ceil( this.h / s );

   this.min    = [];
   this.max    = [];
   this.fnz    = [];   // first non-zero (smallest value > 0), null if none
   this.nonpos = [];   // number of values <= 0
   this.count  = [];   // number of valid (non-NaN) samples
   this.prev   = [];   // decimated channel data for the preview

   for ( var c = 0; c < this.nc; ++c )
   {
      var a = this.load( c );
      var mn = Infinity, mx = -Infinity, fz = Infinity, np = 0, cnt = 0;
      for ( var i = 0, n = this.n; i < n; ++i )
      {
         var v = a[i];
         if ( v !== v ) continue;        // NaN
         ++cnt;
         if ( v < mn ) mn = v;
         if ( v > mx ) mx = v;
         if ( v > 0 ) { if ( v < fz ) fz = v; }
         else ++np;
      }
      if ( cnt == 0 ) { mn = 0; mx = 0; }
      this.min.push( mn );
      this.max.push( mx );
      this.fnz.push( (fz === Infinity) ? null : fz );
      this.nonpos.push( np );
      this.count.push( cnt );

      var p = new Float32Array( this.pw * this.ph );
      for ( var y = 0, k = 0; y < this.ph; ++y )
      {
         var row = y * s * this.w;
         for ( var x = 0; x < this.pw; ++x, ++k )
         {
            var v = a[row + x * s];
            p[k] = (v === v) ? v : 0;
         }
      }
      this.prev.push( p );
   }

   // Exact order statistics (0-based ranks) over the given channels.
   // Two passes: 2^20-bin histogram, then sort the samples of the target bins.
   this.orderStats = function( chs, ranks )
   {
      var mn = Infinity, mx = -Infinity;
      for ( var j = 0; j < chs.length; ++j )
      {
         mn = Math.min( mn, this.min[chs[j]] );
         mx = Math.max( mx, this.max[chs[j]] );
      }
      if ( !(mx > mn) )
         return ranks.map( function() { return mn; } );

      var B = HIST_BINS;
      var scale = (B - 1) / (mx - mn);
      var counts = new Uint32Array( B );
      for ( var j = 0; j < chs.length; ++j )
      {
         var a = this.load( chs[j] );
         for ( var i = 0, n = this.n; i < n; ++i )
         {
            var v = a[i];
            if ( v === v )
               ++counts[((v - mn)*scale) | 0];
         }
      }

      // locate the bin of every rank
      var loc = [];
      for ( var r = 0; r < ranks.length; ++r )
      {
         var cum = 0, b = 0;
         for ( ; b < B; ++b )
         {
            if ( cum + counts[b] > ranks[r] )
               break;
            cum += counts[b];
         }
         if ( b >= B ) b = B - 1;
         loc.push( { bin: b, k: ranks[r] - cum } );
      }

      // collect & sort the samples of the needed bins
      var bins = {};
      for ( var r = 0; r < loc.length; ++r )
         if ( !bins.hasOwnProperty( loc[r].bin ) )
            bins[loc[r].bin] = { data: new Float64Array( counts[loc[r].bin] ), fill: 0 };
      var keys = Object.keys( bins ).map( Number );

      for ( var j = 0; j < chs.length; ++j )
      {
         var a = this.load( chs[j] );
         for ( var i = 0, n = this.n; i < n; ++i )
         {
            var v = a[i];
            if ( v !== v ) continue;
            var b = ((v - mn)*scale) | 0;
            for ( var q = 0; q < keys.length; ++q )
               if ( b == keys[q] )
               {
                  var e = bins[b];
                  e.data[e.fill++] = v;
                  break;
               }
         }
      }
      for ( var q = 0; q < keys.length; ++q )
      {
         var e = bins[keys[q]];
         var arr = new Array( e.data.length );
         for ( var i = 0; i < e.data.length; ++i )
            arr[i] = e.data[i];
         arr.sort( function( x, y ) { return x - y; } );
         e.data = arr;
      }

      return loc.map( function( l )
      {
         var d = bins[l.bin].data;
         return d[Math.max( 0, Math.min( d.length - 1, l.k ) )];
      } );
   };

   // Pedestal value for a set of channels (== SASpro _pedestal_scalar)
   this.pedestalFor = function( chs, mode, pct )
   {
      if ( mode == "percentile" )
      {
         var n = 0;
         for ( var j = 0; j < chs.length; ++j )
            n += this.count[chs[j]];
         if ( n == 0 )
            return 0;
         // numpy.percentile, method "linear"
         var pos  = (pct / 100) * (n - 1);
         var lo   = Math.floor( pos );
         var hi   = Math.min( lo + 1, n - 1 );
         var frac = pos - lo;
         if ( frac == 0 || hi == lo )
            return this.orderStats( chs, [ lo ] )[0];
         var st = this.orderStats( chs, [ lo, hi ] );
         return st[0] + (st[1] - st[0])*frac;
      }
      if ( mode == "first_nonzero" )
      {
         var f = Infinity;
         for ( var j = 0; j < chs.length; ++j )
            if ( this.fnz[chs[j]] !== null )
               f = Math.min( f, this.fnz[chs[j]] );
         return (f === Infinity) ? 0 : f;
      }
      // "min" (default / fallback)
      var m = Infinity;
      for ( var j = 0; j < chs.length; ++j )
         m = Math.min( m, this.min[chs[j]] );
      return m;
   };

   // Returns { vals: [...], clipped: [...] } without modifying the image
   this.compute = function( mode, pct, perChannel )
   {
      var vals = [], clipped = [];
      var all = [];
      for ( var c = 0; c < this.nc; ++c )
         all.push( c );

      if ( perChannel || this.nc == 1 )
         for ( var c = 0; c < this.nc; ++c )
            vals.push( this.pedestalFor( [ c ], mode, pct ) );
      else
      {
         var g = this.pedestalFor( all, mode, pct );
         for ( var c = 0; c < this.nc; ++c )
            vals.push( g );
      }

      // pixels driven below zero (clamped to black)
      for ( var c = 0; c < this.nc; ++c )
      {
         var v = vals[c];
         if ( mode == "min" )
            clipped.push( 0 );                         // nothing is below the minimum
         else if ( mode == "first_nonzero" )
            clipped.push( (v > 0) ? this.nonpos[c] : 0 );
         else
         {
            var a = this.load( c ), cnt = 0;
            for ( var i = 0, n = this.n; i < n; ++i )
               if ( a[i] < v ) ++cnt;
            clipped.push( cnt );
         }
      }
      return { vals: vals, clipped: clipped };
   };
}

// ----------------------------------------------------------------------------
// Apply through PixelMath (respects mask, creates undo/history entry)
// ----------------------------------------------------------------------------
function applyPedestal( view, vals )
{
   function expr( v )
   {
      return "$T - (" + v.toFixed( 12 ) + ")";
   }

   var P = new PixelMath;
   if ( vals.length == 1 )
   {
      P.expression = expr( vals[0] );
      P.useSingleExpression = true;
   }
   else
   {
      P.expression  = expr( vals[0] );
      P.expression1 = expr( vals[1] );
      P.expression2 = expr( vals[2] );
      P.useSingleExpression = false;
   }
   P.expression3 = "";
   P.symbols = "";
   P.generateOutput = true;
   P.singleThreaded = false;
   P.use64BitWorkingImage = false;
   P.rescale = false;
   P.truncate = true;          // clip to [0,1] like SASpro
   P.truncateLower = 0;
   P.truncateUpper = 1;
   P.createNewImage = false;
   P.showNewImage = false;
   return P.executeOn( view );
}

function channelNames( nc )
{
   return (nc > 1) ? [ "R", "G", "B" ] : [ "K" ];
}

function formatReadout( an, res )
{
   if ( !an || !res )
      return "Subtracting: —";
   var names = channelNames( an.nc );
   var lines = [ "Subtracting / pixels clamped to black:" ];
   for ( var c = 0; c < res.vals.length; ++c )
   {
      var pct = an.n ? 100 * res.clipped[c] / an.n : 0;
      lines.push( names[c] + ": " + res.vals[c].toFixed( 6 ) +
                  "   →  clipped " + res.clipped[c] + " px (" + pct.toFixed( 3 ) + "%)" );
   }
   return lines.join( "\n" );
}

function logResult( view, res )
{
   var names = channelNames( res.vals.length );
   var s = "<end><cbr><b>" + TITLE + "</b> on " + view.fullId + " (" + params.mode +
           (params.mode == "percentile" ? ", P" + params.pct : "") +
           (params.perChannel ? ", per channel" : ", global") + "): ";
   for ( var c = 0; c < res.vals.length; ++c )
      s += names[c] + "=" + res.vals[c].toFixed( 6 ) + "  ";
   console.writeln( s );
}

// ----------------------------------------------------------------------------
// Preview rendering (display only, data stays linear)
// ----------------------------------------------------------------------------
function mtf( m, x )
{
   if ( x <= 0 ) return 0;
   if ( x >= 1 ) return 1;
   if ( m == 0.5 ) return x;
   return (m - 1)*x / ((2*m - 1)*x - m);
}

function medianOf( a )
{
   var n = a.length;
   if ( n == 0 ) return 0;
   var b = new Array( n );
   for ( var i = 0; i < n; ++i )
      b[i] = a[i];
   b.sort( function( x, y ) { return x - y; } );
   return (n & 1) ? b[n >> 1] : 0.5*(b[(n >> 1) - 1] + b[n >> 1]);
}

function renderPreview( an, vals, autoStretch, showOriginal )
{
   var nc = an.nc, pw = an.pw, ph = an.ph, n = pw * ph;
   var out = [];
   for ( var c = 0; c < nc; ++c )
   {
      var src = an.prev[c], o = new Float32Array( n );
      var ped = (showOriginal || !vals) ? 0 : vals[c];
      for ( var i = 0; i < n; ++i )
      {
         var x = src[i] - ped;
         o[i] = (x < 0) ? 0 : ((x > 1) ? 1 : x);
      }
      out.push( o );
   }

   if ( autoStretch )
   {
      // linked auto-STF (shows colour casts honestly)
      var sumC0 = 0, sumMed = 0;
      for ( var c = 0; c < nc; ++c )
      {
         var med = medianOf( out[c] );
         var dev = new Float32Array( n );
         for ( var i = 0; i < n; ++i )
            dev[i] = Math.abs( out[c][i] - med );
         var madn = 1.4826 * medianOf( dev );
         sumMed += med;
         sumC0  += (madn > 0) ? Math.max( 0, med - 2.8*madn ) : 0;
      }
      var c0  = Math.min( sumC0 / nc, 0.999 );
      var med = sumMed / nc;
      var m   = mtf( DISPLAY_TARGET_MEDIAN, Math.max( 1e-7, med - c0 ) );
      var r   = 1 / (1 - c0);
      for ( var c = 0; c < nc; ++c )
      {
         var o = out[c];
         for ( var i = 0; i < n; ++i )
            o[i] = mtf( m, (o[i] - c0)*r );
      }
   }

   var img = new Image( pw, ph, nc, (nc == 3) ? ColorSpace_RGB : ColorSpace_Gray, 32, SampleType_Real );
   var rect = new Rect( pw, ph );
   for ( var c = 0; c < nc; ++c )
      img.setSamples( out[c], rect, c );
   var bmp = img.render();
   img.free();
   return bmp;
}

// ----------------------------------------------------------------------------
// Dialog
// ----------------------------------------------------------------------------
function PedestalDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var self = this;
   this.analyzer = null;
   this.pedResult = null;
   this.bitmap   = null;
   this.previewMax = this.logicalPixelsToPhysical( 480 );

   // --- help text ---
   this.helpLabel = new Label( this );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.minWidth = this.logicalPixelsToPhysical( 340 );
   this.helpLabel.text =
      "<p><b>" + TITLE + " " + VERSION + "</b> &mdash; subtract a pedestal (a constant offset) from the image.</p>" +
      "<p>&bull; <b>Image minimum</b> &mdash; classic; removes the darkest value per channel.<br/>" +
      "&bull; <b>Low percentile</b> &mdash; ignores a few grossly-low cold pixels that would otherwise " +
      "peg the floor and make min-subtract do nothing.<br/>" +
      "&bull; <b>First non-zero value</b> &mdash; subtracts the smallest value above zero, for data " +
      "sitting on a hard zero floor with a small real offset.</p>" +
      "<p><i>Port of Remove Pedestal from Seti Astro Suite Pro.</i></p>";

   // --- target view ---
   this.viewList = new ViewList( this );
   this.viewList.getAll();
   this.viewList.toolTip = "Target image (main view or preview).";
   this.viewList.onViewSelected = function( view )
   {
      self.setTarget( view );
   };

   var targetSizer = new HorizontalSizer;
   targetSizer.spacing = 4;
   var tl = new Label( this );
   tl.text = "Target:";
   tl.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   targetSizer.add( tl );
   targetSizer.add( this.viewList, 100 );

   // --- mode ---
   this.modeCombo = new ComboBox( this );
   for ( var i = 0; i < MODES.length; ++i )
      this.modeCombo.addItem( this.modeLabel( i ) );
   this.modeCombo.currentItem = Math.max( 0, MODES.indexOf( params.mode ) );
   this.modeCombo.onItemSelected = function( index )
   {
      params.mode = MODES[index];
      self.syncControls();
      self.recompute();
   };

   var modeSizer = new HorizontalSizer;
   modeSizer.spacing = 4;
   var ml = new Label( this );
   ml.text = "Subtract:";
   ml.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   modeSizer.add( ml );
   modeSizer.add( this.modeCombo, 100 );

   // --- percentile ---
   this.pctControl = new NumericControl( this );
   this.pctControl.label.text = "Percentile (%):";
   this.pctControl.setRange( 0, 50 );
   this.pctControl.slider.setRange( 0, 1000 );
   this.pctControl.setPrecision( 3 );
   this.pctControl.edit.setFixedWidth( this.font.width( "00.0000" ) );
   this.pctControl.setValue( params.pct );
   this.pctControl.toolTip =
      "<p>Percentile of pixel values to subtract.</p>" +
      "<p>0.1 % is a good starting point &mdash; it steps past a handful of cold/hot outliers " +
      "without eating real signal.</p>";
   this.pctControl.onValueUpdated = function( value )
   {
      params.pct = value;
      self.modeCombo.setItemText( 1, self.modeLabel( 1 ) );
      self.scheduleRecompute();
   };

   // --- options ---
   this.perChannelCheck = new CheckBox( this );
   this.perChannelCheck.text = "Per-channel (RGB)";
   this.perChannelCheck.checked = params.perChannel;
   this.perChannelCheck.toolTip =
      "<p>On: compute a separate pedestal for R, G and B (also removes a background colour cast).</p>" +
      "<p>Off: one pedestal across all channels.</p>";
   this.perChannelCheck.onCheck = function( checked )
   {
      params.perChannel = checked;
      self.recompute();
   };

   this.autoStretchCheck = new CheckBox( this );
   this.autoStretchCheck.text = "Auto display stretch (preview only)";
   this.autoStretchCheck.checked = params.autoStretch;
   this.autoStretchCheck.toolTip =
      "<p>Linear data looks nearly black. This applies a temporary screen stretch to the " +
      "PREVIEW only &mdash; it does not change the data that gets applied.</p>";
   this.autoStretchCheck.onCheck = function( checked )
   {
      params.autoStretch = checked;
      self.updatePreview();
   };

   this.originalCheck = new CheckBox( this );
   this.originalCheck.text = "Show original (before)";
   this.originalCheck.checked = false;
   this.originalCheck.onCheck = function()
   {
      self.updatePreview();
   };

   // --- readout ---
   this.readout = new Label( this );
   this.readout.wordWrapping = true;
   this.readout.useRichText = false;
   this.readout.styleSheet = "QLabel { font-family: monospace; }";
   this.readout.text = "Subtracting: —";

   // --- preview ---
   this.previewControl = new Control( this );
   this.previewControl.setMinSize( this.previewMax, this.previewMax );
   this.previewControl.onPaint = function()
   {
      var g = new Graphics( this );
      g.fillRect( this.boundsRect, new Brush( 0xff1e1e1e ) );
      if ( self.bitmap )
      {
         var bx = Math.max( 0, Math.round( (this.width  - self.bitmap.width) /2 ) );
         var by = Math.max( 0, Math.round( (this.height - self.bitmap.height)/2 ) );
         g.drawBitmap( bx, by, self.bitmap );
      }
      else
      {
         g.pen = new Pen( 0xffa0a0a0 );
         g.drawTextRect( this.boundsRect, "No image", TextAlign_Center );
      }
      g.end();
   };

   // --- buttons ---
   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 24, 24 );
   this.newInstanceButton.toolTip =
      "New Instance: drag to the workspace to create a process icon with these settings, " +
      "or drop it onto an image to apply them directly.";
   this.newInstanceButton.onMousePress = function()
   {
      this.hasFocus = true;
      params.save();
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.applyButton = new PushButton( this );
   this.applyButton.text = "Apply";
   this.applyButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.applyButton.toolTip = "Apply the pedestal subtraction to the target view.";
   this.applyButton.onClick = function()
   {
      self.apply();
   };

   this.closeButton = new PushButton( this );
   this.closeButton.text = "Close";
   this.closeButton.icon = this.scaledResource( ":/icons/close.png" );
   this.closeButton.onClick = function()
   {
      self.ok();
   };

   var buttonSizer = new HorizontalSizer;
   buttonSizer.spacing = 6;
   buttonSizer.add( this.newInstanceButton );
   buttonSizer.addStretch();
   buttonSizer.add( this.applyButton );
   buttonSizer.add( this.closeButton );

   // --- layout ---
   var left = new VerticalSizer;
   left.spacing = 6;
   left.add( this.helpLabel );
   left.add( targetSizer );
   left.add( modeSizer );
   left.add( this.pctControl );
   left.add( this.perChannelCheck );
   left.add( this.autoStretchCheck );
   left.add( this.originalCheck );
   left.addSpacing( 6 );
   left.add( this.readout );
   left.addStretch();
   left.add( buttonSizer );

   this.sizer = new HorizontalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 10;
   this.sizer.add( left );
   this.sizer.add( this.previewControl, 100 );

   this.windowTitle = TITLE;
   this.adjustToContents();

   // --- debounce for slider changes ---
   this.timer = new Timer;
   this.timer.interval = 0.4;
   this.timer.periodic = false;
   this.timer.onTimeout = function()
   {
      self.recompute();
   };

   // --- initial target ---
   var w = ImageWindow.activeWindow;
   if ( !w.isNull )
   {
      this.viewList.currentView = w.currentView;
      this.setTarget( w.currentView );
   }
   this.syncControls();
}

PedestalDialog.prototype = new Dialog;

PedestalDialog.prototype.modeLabel = function( i )
{
   return MODE_LABELS[i].replace( "%PCT%", String( Math.round( params.pct*1000 )/1000 ) );
};

PedestalDialog.prototype.syncControls = function()
{
   this.pctControl.enabled = (params.mode == "percentile");
   this.applyButton.enabled = (this.analyzer != null);
};

PedestalDialog.prototype.scheduleRecompute = function()
{
   this.timer.stop();
   this.timer.start();
};

PedestalDialog.prototype.setTarget = function( view )
{
   this.analyzer = null;
   this.pedResult = null;
   this.bitmap = null;
   if ( view && !view.isNull )
   {
      console.show();
      console.writeln( "<end><cbr>" + TITLE + ": analysing " + view.fullId + " ..." );
      processEvents();
      this.analyzer = new PedestalAnalyzer( view, this.previewMax );
      this.perChannelCheck.enabled = (this.analyzer.nc > 1);
   }
   this.syncControls();
   this.recompute();
};

PedestalDialog.prototype.recompute = function()
{
   if ( !this.analyzer )
   {
      this.readout.text = "Subtracting: —";
      this.previewControl.repaint();
      return;
   }
   processEvents();
   this.pedResult = this.analyzer.compute( params.mode, params.pct, params.perChannel );
   this.readout.text = formatReadout( this.analyzer, this.pedResult );
   this.updatePreview();
};

PedestalDialog.prototype.updatePreview = function()
{
   if ( this.analyzer )
      this.bitmap = renderPreview( this.analyzer, this.pedResult ? this.pedResult.vals : null,
                                   params.autoStretch, this.originalCheck.checked );
   else
      this.bitmap = null;
   this.previewControl.repaint();
};

PedestalDialog.prototype.apply = function()
{
   if ( !this.analyzer )
   {
      new MessageBox( "Select a target image first.", TITLE, StdIcon_Information, StdButton_Ok ).execute();
      return;
   }
   if ( !this.pedResult )
      this.pedResult = this.analyzer.compute( params.mode, params.pct, params.perChannel );

   var view = this.analyzer.view;
   applyPedestal( view, this.pedResult.vals );
   logResult( view, this.pedResult );

   // image changed -> re-analyse so a second Apply works on the new data
   this.setTarget( view );
};

// ----------------------------------------------------------------------------
// Headless execution (process icon dropped onto a view)
// ----------------------------------------------------------------------------
function runOnView( view )
{
   var an = new PedestalAnalyzer( view, 64 );
   var res = an.compute( params.mode, params.pct, params.perChannel );
   applyPedestal( view, res.vals );
   logResult( view, res );
}

function main()
{
   if ( Parameters.isViewTarget )
   {
      params.load();
      runOnView( Parameters.targetView );
      return;
   }
   if ( Parameters.isGlobalTarget )
      params.load();

   var dlg = new PedestalDialog;
   dlg.execute();
}

main();

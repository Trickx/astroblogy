// ============================================================================
// Histogram.js  -  PixInsight 1.9.x (PJSR / V8)
// ----------------------------------------------------------------------------
// Port of the histogram view from Seti Astro Suite Pro (SASpro)
//   original: setiastro/setiastrosuitepro  src/setiastro/saspro/histogram.py
//   (c) Franklin Marek, GPL-3.0
// This port is likewise released under the GNU GPL v3.
//
// Displays a non-destructive histogram and statistics view for the active
// image, with separate RGB curves and grayscale support.
//
// Provides linear or logarithmic axes, zoom and range controls, reproducible
// sampling for large images, percentiles and clipping statistics.
//
// This script is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3.
// SPDX-License-Identifier: GPL-3.0-only
// ============================================================================

#script-id     Histogram
#feature-id    Tricx > Histogram
#feature-info  Non-destructive histogram and statistics viewer for the active image.
#feature-icon  Histogram.svg

#include <pjsr/Sizer.jsh>
#include <pjsr/StdIcon.jsh>

var HISTOGRAM_BINS = 512;
var MAX_STAT_SAMPLES = 300000;

function clamp01( value )
{
   return Math.max( 0, Math.min( 1, value ) );
}

function percentile( values, fraction )
{
   if ( values.length == 0 )
      return 0;

   var index = (values.length - 1) * fraction;
   var lower = Math.floor( index );
   var upper = Math.ceil( index );
   if ( lower == upper )
      return values[lower];
   return values[lower] + (values[upper] - values[lower]) * (index - lower);
}

function zeroArray( length )
{
   var result = [];
   for ( var i = 0; i < length; ++i )
      result.push( 0 );
   return result;
}

function HistogramParameters()
{
   this.logX = false;
   this.logY = false;
   this.zoom = 1;
   this.pan = 0;
   this.stats = false;
   this.showRed = true;
   this.showGreen = true;
   this.showBlue = true;

   this.load = function()
   {
      if ( Parameters.has( "logX" ) ) this.logX = Parameters.getBoolean( "logX" );
      if ( Parameters.has( "logY" ) ) this.logY = Parameters.getBoolean( "logY" );
      if ( Parameters.has( "zoom" ) ) this.zoom = Math.max( 1, Math.min( 3, Parameters.getReal( "zoom" ) ) );
      if ( Parameters.has( "pan" ) ) this.pan = Math.max( 0, Math.min( 1000, Parameters.getInteger( "pan" ) ) );
      if ( Parameters.has( "stats" ) ) this.stats = Parameters.getBoolean( "stats" );
      if ( Parameters.has( "showRed" ) ) this.showRed = Parameters.getBoolean( "showRed" );
      if ( Parameters.has( "showGreen" ) ) this.showGreen = Parameters.getBoolean( "showGreen" );
      if ( Parameters.has( "showBlue" ) ) this.showBlue = Parameters.getBoolean( "showBlue" );
   };
}

function channelStatistics( values )
{
   if ( values.length == 0 )
      return { min: 0, max: 0, mean: 0, median: 0, stddev: 0, variance: 0, mad: 0,
            iqr: 0, p01: 0, p1: 0, p5: 0, p25: 0, p75: 0, p95: 0, p99: 0, p999: 0,
            low: 0, high: 0 };

   values.sort( function( a, b ) { return a - b; } );
   var sum = 0;
   for ( var i = 0; i < values.length; ++i )
      sum += values[i];
   var mean = sum / values.length;
   var variance = 0;
   for ( var j = 0; j < values.length; ++j )
      variance += (values[j] - mean) * (values[j] - mean);
   var median = percentile( values, 0.5 );
   var deviations = [];
   var low = 0;
   var high = 0;
   for ( var k = 0; k < values.length; ++k )
   {
      deviations.push( Math.abs( values[k] - median ) );
      if ( values[k] <= 0 )
         ++low;
      if ( values[k] >= 1 - 1.0e-6 )
         ++high;
   }
   deviations.sort( function( a, b ) { return a - b; } );
   var p25 = percentile( values, 0.25 );
   var p75 = percentile( values, 0.75 );
   return {
      min: values[0],
      max: values[values.length - 1],
      mean: mean,
      median: median,
      stddev: Math.sqrt( variance / values.length ),
      variance: variance / values.length,
      mad: percentile( deviations, 0.5 ),
      iqr: p75 - p25,
      p01: percentile( values, 0.001 ),
      p1: percentile( values, 0.01 ),
      p5: percentile( values, 0.05 ),
      p25: p25,
      p75: p75,
      p95: percentile( values, 0.95 ),
      p99: percentile( values, 0.99 ),
      p999: percentile( values, 0.999 ),
      low: low,
      high: high
   };
}

function HistogramModel( image )
{
   this.image = image;
   this.color = image.numberOfChannels == 3;
   this.channels = this.color ? 3 : 1;
   this.linear = [];
   this.logarithmic = [];
   this.statistics = [];
   this.sampleCount = 0;
   this.logMinimumExponent = -6;
   this.rebuild();
}

HistogramModel.prototype.rebuild = function()
{
   this.linear = [];
   this.logarithmic = [];
   this.statistics = [];
   for ( var c = 0; c < this.channels; ++c )
   {
      this.linear.push( zeroArray( HISTOGRAM_BINS ) );
      this.logarithmic.push( zeroArray( HISTOGRAM_BINS ) );
      this.statistics.push( [] );
   }

   var total = this.image.width * this.image.height;
   // Use a regular image grid instead of visiting every pixel and rejecting
   // most of them with a modulus test. This is much faster for large images.
   var step = Math.max( 1, Math.ceil( Math.sqrt( total / MAX_STAT_SAMPLES ) ) );
   var positiveMinimum = 1;
   var samples = [];
   for ( var c2 = 0; c2 < this.channels; ++c2 )
      samples.push( [] );

   for ( var y = 0; y < this.image.height; y += step )
      for ( var x = 0; x < this.image.width; x += step )
      {
         for ( var channel = 0; channel < this.channels; ++channel )
         {
            var value = clamp01( this.image.sample( x, y, channel ) );
            var linearBin = Math.min( HISTOGRAM_BINS - 1, Math.floor( value * HISTOGRAM_BINS ) );
            ++this.linear[channel][linearBin];
            if ( value > 0 )
               positiveMinimum = Math.min( positiveMinimum, value );
            samples[channel].push( value );
         }
      }

   this.sampleCount = samples[0].length;
   var logMinimum = Math.max( 1.0e-6, positiveMinimum );
   var logMinimumExponent = Math.log10( logMinimum );
   this.logMinimumExponent = logMinimumExponent;
   for ( var c3 = 0; c3 < this.channels; ++c3 )
   {
      this.statistics[c3] = channelStatistics( samples[c3] );
      for ( var s = 0; s < samples[c3].length; ++s )
      {
         if ( samples[c3][s] <= 0 )
            continue;
         var logFraction = (Math.log10( samples[c3][s] ) - logMinimumExponent) / -logMinimumExponent;
         var logBin = Math.min( HISTOGRAM_BINS - 1,
                                Math.max( 0, Math.floor( logFraction * HISTOGRAM_BINS ) ) );
         ++this.logarithmic[c3][logBin];
      }
   }
};

function HistogramDialog()
{
   this.__base__ = Dialog;
   this.__base__();
   this.windowTitle = "Histogram";
   this.model = null;
   this.logX = false;
   this.logY = false;
   this.zoom = 1;
   this.pan = 0;
   this.statsVisible = false;
   this.channelVisible = [ true, true, true ];
   this.targetView = null;
   var owner = this;

   this.canvas = new Control( this );
   this.canvas.minWidth = 720;
   this.canvas.minHeight = 300;
   this.canvas.onPaint = function( x0, y0, x1, y1 ) { owner.paintHistogram(); };

   this.statLabels = [];
   this.statsPanel = new VerticalSizer;
   this.statsPanel.spacing = 2;
   var statHeader = this.makeStatRow( [ "", "R", "G", "B" ] );
   this.statHeader = statHeader.values;
   this.statsPanel.add( statHeader.sizer );
   var statNames = [ "Min", "Max", "Mean", "Median", "StdDev", "Variance", "MAD", "IQR (p75-p25)",
                     "p0.1", "p1", "p5", "p25", "p50", "p75", "p95", "p99", "p99.9",
                     "Low Clipped (<=0)", "High Clipped (>=TrueMax)" ];
   for ( var statIndex = 0; statIndex < statNames.length; ++statIndex )
   {
      var statRow = this.makeStatRow( [ statNames[statIndex], "-", "-", "-" ] );
      this.statLabels.push( statRow.values );
      this.statsPanel.add( statRow.sizer );
   }

   this.logXButton = new PushButton( this );
   this.logXButton.checkable = true;
   this.logXButton.autoExclusive = false;
   this.logXButton.onClick = function() { owner.logX = !owner.logX; owner.updateToggleLabels(); owner.canvas.repaint(); };
   this.logYButton = new PushButton( this );
   this.logYButton.checkable = true;
   this.logYButton.autoExclusive = false;
   this.logYButton.onClick = function() { owner.logY = !owner.logY; owner.updateToggleLabels(); owner.canvas.repaint(); };

   this.statsButton = new PushButton( this );
   this.statsButton.checkable = true;
   this.statsButton.autoExclusive = false;
   this.statsButton.onClick = function() { owner.toggleStatistics(); };
   this.updateToggleLabels();

   this.zoomSlider = new Slider( this );
   this.zoomSlider.minValue = 100;
   this.zoomSlider.maxValue = 300;
   this.zoomSlider.value = 100;
   this.zoomSlider.onValueUpdated = function( value )
   {
      owner.zoom = value / 100;
      owner.panSlider.enabled = owner.zoom > 1.001;
      if ( owner.zoom <= 1.001 )
         owner.panSlider.value = 0;
      owner.canvas.repaint();
   };

   this.panSlider = new Slider( this );
   this.panSlider.minValue = 0;
   this.panSlider.maxValue = 1000;
   this.panSlider.value = 0;
   this.panSlider.enabled = false;
   this.panSlider.onValueUpdated = function( value ) { owner.pan = value; owner.canvas.repaint(); };

   this.viewList = new ViewList( this );
   this.viewList.getAll();
   this.viewList.onViewSelected = function( view )
   {
      if ( view && !view.isNull )
      {
         owner.targetView = view;
         owner.refreshModel();
      }
   };
   var activeWindow = ImageWindow.activeWindow;
   if ( !activeWindow.isNull )
   {
      this.targetView = activeWindow.currentView;
      this.viewList.currentView = this.targetView;
   }

   this.channelChecks = [];
   var channelNames = [ "R", "G", "B" ];
   for ( var channelIndex = 0; channelIndex < 3; ++channelIndex )
   {
      var channelCheck = new CheckBox( this );
      channelCheck.text = channelNames[channelIndex];
      channelCheck.checked = true;
      channelCheck.channelIndex = channelIndex;
      channelCheck.onCheck = function( checked )
      {
         owner.channelVisible[this.channelIndex] = checked === undefined ? this.checked : checked;
         owner.canvas.repaint();
      };
      this.channelChecks.push( channelCheck );
   }

   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 16, 16 );
   this.newInstanceButton.toolTip = "New Instance: drag to the workspace to create a process icon with the current histogram settings.";
   this.newInstanceButton.onMousePress = function()
   {
      this.hasFocus = true;
      this.pushed = false;
      owner.exportParameters();
      owner.newInstance();
   };

   this.close = new PushButton( this );
   this.close.text = "Close";
   this.close.onClick = function() { owner.cancel(); };

   var chartRow = new HorizontalSizer;
   chartRow.spacing = 8;
   var histogramColumn = new VerticalSizer;
   histogramColumn.spacing = 6;
   histogramColumn.add( this.canvas, 1 );

   var targetRow = new HorizontalSizer;
   targetRow.spacing = 6;
   var targetLabel = new Label( this );
   targetLabel.text = "Image";
   targetRow.add( targetLabel );
   targetRow.add( this.viewList, 1 );
   histogramColumn.add( targetRow );

   var zoomRow = new HorizontalSizer;
   zoomRow.spacing = 8;
   var zoomLabel = new Label( this );
   zoomLabel.text = "Zoom";
   zoomRow.add( zoomLabel );
   zoomRow.add( this.zoomSlider, 1 );

   var panRow = new HorizontalSizer;
   panRow.spacing = 8;
   var rangeLabel = new Label( this );
   rangeLabel.text = "Range";
   panRow.add( rangeLabel );
   panRow.add( this.panSlider, 1 );
   histogramColumn.add( zoomRow );
   histogramColumn.add( panRow );

   var statsColumn = new VerticalSizer;
   statsColumn.spacing = 6;
   statsColumn.add( this.statsPanel );
   statsColumn.addStretch();
   this.statsControl = new Control( this );
   this.statsControl.sizer = statsColumn;
   this.statsControl.visible = this.statsVisible;

   var controls = new HorizontalSizer;
   controls.spacing = 8;
   controls.add( this.newInstanceButton );
   controls.addStretch();
   controls.add( this.logXButton );
   controls.add( this.logYButton );
   controls.add( this.statsButton );
   for ( var checkIndex = 0; checkIndex < this.channelChecks.length; ++checkIndex )
      controls.add( this.channelChecks[checkIndex] );
   controls.add( this.close );
   histogramColumn.add( controls );
   chartRow.add( histogramColumn, 1 );
   chartRow.add( this.statsControl, 0 );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( chartRow, 1 );
   this.adjustToContents();
   this.setMinSize( this.statsVisible ? 1100 : 760, 650 );
}

HistogramDialog.prototype = new Dialog;

HistogramDialog.prototype.makeStatRow = function( values )
{
   var row = new HorizontalSizer;
   row.spacing = 0;
   var labels = [];
   for ( var i = 0; i < values.length; ++i )
   {
      var label = new Label( this );
      label.text = values[i];
      label.minWidth = i == 0 ? 150 : 72;
      label.maxWidth = i == 0 ? 150 : 72;
      label.wordWrapping = i == 0;
      label.styleSheet = "border: 1px solid #4a5158; padding: 2px 4px;";
      row.add( label );
      labels.push( label );
   }
   return { sizer: row, values: labels };
};

HistogramDialog.prototype.updateToggleLabels = function()
{
   this.logXButton.text = "Log X";
   this.logYButton.text = "Log Y";
   this.statsButton.text = "Stats";
   this.logXButton.checked = this.logX;
   this.logYButton.checked = this.logY;
   this.statsButton.checked = this.statsVisible;
   this.logXButton.styleSheet = this.logX ? "background: #555a60; color: #f0f0f0;" : "";
   this.logYButton.styleSheet = this.logY ? "background: #555a60; color: #f0f0f0;" : "";
   this.statsButton.styleSheet = this.statsVisible ? "background: #555a60; color: #f0f0f0;" : "";
};

HistogramDialog.prototype.exportParameters = function()
{
   Parameters.set( "logX", this.logX );
   Parameters.set( "logY", this.logY );
   Parameters.set( "zoom", this.zoom );
   Parameters.set( "pan", this.panSlider.value );
   Parameters.set( "stats", this.statsVisible );
   Parameters.set( "showRed", this.channelVisible[0] );
   Parameters.set( "showGreen", this.channelVisible[1] );
   Parameters.set( "showBlue", this.channelVisible[2] );
};

HistogramDialog.prototype.toggleStatistics = function()
{
   this.statsVisible = !this.statsVisible;
   this.statsControl.visible = this.statsVisible;
   this.updateToggleLabels();
   this.setMinSize( this.statsVisible ? 1100 : 760, 650 );
   this.adjustToContents();
   this.repaint();
};

HistogramDialog.prototype.refreshModel = function()
{
   var view = this.targetView;
   if ( view == null || view.isNull )
   {
      this.model = null;
   }
   else
   {
      this.model = new HistogramModel( view.image );
      for ( var channelControlIndex = 0; channelControlIndex < this.channelChecks.length; ++channelControlIndex )
         this.channelChecks[channelControlIndex].enabled = this.model.color;
      var channels = this.model.color ? [ "R", "G", "B" ] : [ "Gray", "", "" ];
      for ( var headerIndex = 0; headerIndex < channels.length; ++headerIndex )
         this.statHeader[headerIndex + 1].text = channels[headerIndex];
      var rows = [ "min", "max", "mean", "median", "stddev", "variance", "mad", "iqr",
             "p01", "p1", "p5", "p25", "median", "p75", "p95", "p99", "p999", "low", "high" ];
      for ( var rowIndex = 0; rowIndex < rows.length; ++rowIndex )
         for ( var channelIndex = 0; channelIndex < 3; ++channelIndex )
         {
            var statistic = this.model.statistics[channelIndex];
            var cell = this.statLabels[rowIndex][channelIndex + 1];
            if ( statistic == undefined )
               cell.text = "";
            else if ( rows[rowIndex] == "low" || rows[rowIndex] == "high" )
            {
               var clipped = statistic[rows[rowIndex]];
               cell.text = clipped + " (" + (100 * clipped / this.model.sampleCount).toFixed( 3 ) + "%)";
            }
            else
               cell.text = statistic[rows[rowIndex]].toFixed( 6 );
         }
   }
   this.canvas.repaint();
};

HistogramDialog.prototype.paintHistogram = function()
{
   var g = new Graphics( this.canvas );
   g.brush = new Brush( 0xff20242a );
   g.fillRect( new Rect( 0, 0, this.canvas.width, this.canvas.height ) );
   if ( this.model == null )
   {
      g.pen = new Pen( 0xffeeeeee );
      g.drawText( 24, 32, "No active image." );
      g.end();
      return;
   }

   var left = 52, top = 30, bottom = 48, right = 12;
   var visibleWidth = Math.max( 1, this.canvas.width - left - right );
   var width = Math.max( 1, visibleWidth * this.zoom );
   var offset = Math.max( 0, width - visibleWidth ) * this.panSlider.value / 1000;
   var height = this.canvas.height - top - bottom;
   var counts = this.logX ? this.model.logarithmic : this.model.linear;
   var maxCount = 1;
   for ( var c = 0; c < counts.length; ++c )
      for ( var i = 0; i < counts[c].length; ++i )
         maxCount = Math.max( maxCount, counts[c][i] );
   var colors = [ 0x99ff5555, 0x9955ff77, 0x996699ff ];
   for ( var channel = 0; channel < counts.length; ++channel )
   {
      if ( this.model.color && !this.channelVisible[channel] )
         continue;
      var channelColor = this.model.color ? colors[channel] : 0xffd0d0d0;
      g.pen = new Pen( channelColor );
      g.brush = new Brush( channelColor );
      for ( var bin = 0; bin < HISTOGRAM_BINS; ++bin )
      {
         var normalized = counts[channel][bin] / maxCount;
         if ( this.logY )
            normalized = Math.log( 1 + counts[channel][bin] ) / Math.log( 1 + maxCount );
         var x = left + Math.floor( bin * width / HISTOGRAM_BINS ) - offset;
         var barWidth = Math.max( 1, Math.ceil( width / HISTOGRAM_BINS ) );
         var barHeight = Math.floor( normalized * height );
         if ( barHeight > 0 )
         {
            var x0 = Math.max( left, x );
            var x1 = Math.min( left + visibleWidth, x + barWidth );
            if ( x1 > x0 )
               g.fillRect( new Rect( x0, top + height - barHeight, x1, top + height ) );
         }
      }
   }
   g.pen = new Pen( 0xffeeeeee );
   g.drawLine( left, top + height, left + visibleWidth, top + height );
   g.drawLine( left, top, left, top + height );
   for ( var tick = 0; tick <= 10; ++tick )
   {
      var tickX = left + Math.floor( tick * width / 10 ) - offset;
      if ( tickX < left || tickX > left + visibleWidth )
         continue;
      g.drawLine( tickX, top + height, tickX, top + height + 5 );
      var xLabel;
      if ( this.logX )
      {
         var exponent = this.model.logMinimumExponent * (1 - tick / 10);
         xLabel = Math.pow( 10, exponent ).toExponential( 1 );
      }
      else
         xLabel = (tick / 10).toFixed( 1 );
      g.drawText( tickX - 18, top + height + 20, xLabel );
   }

   for ( var yTick = 0; yTick <= 5; ++yTick )
   {
      var yFraction = yTick / 5;
      var y = top + height - Math.floor( yFraction * height );
      g.drawLine( left - 5, y, left, y );
      if ( yTick > 0 && yTick < 5 )
         g.drawLine( left, y, left + visibleWidth, y );
      var yLabel;
      if ( this.logY )
         yLabel = Math.pow( 10, yFraction * Math.log10( maxCount ) ).toFixed( 0 );
      else
         yLabel = Math.floor( yFraction * maxCount ).toString();
      g.drawText( 4, y + 4, yLabel );
   }
   g.drawText( 4, top - 10, "Count" );
   g.end();
};

function main()
{
   var parameters = new HistogramParameters;
   if ( Parameters.isViewTarget || Parameters.isGlobalTarget )
      parameters.load();
   histogramDialog = new HistogramDialog;
   histogramDialog.logX = parameters.logX;
   histogramDialog.logY = parameters.logY;
   histogramDialog.zoom = parameters.zoom;
   histogramDialog.panSlider.value = parameters.pan;
   histogramDialog.pan = parameters.pan;
   histogramDialog.statsVisible = parameters.stats;
   histogramDialog.statsControl.visible = histogramDialog.statsVisible;
   if ( histogramDialog.statsVisible )
      histogramDialog.setMinSize( 1100, 650 );
   histogramDialog.channelVisible = [ parameters.showRed, parameters.showGreen, parameters.showBlue ];
   for ( var channelIndex = 0; channelIndex < histogramDialog.channelChecks.length; ++channelIndex )
      histogramDialog.channelChecks[channelIndex].checked = histogramDialog.channelVisible[channelIndex];
   if ( Parameters.isViewTarget )
   {
      histogramDialog.targetView = Parameters.targetView;
      histogramDialog.viewList.currentView = Parameters.targetView;
   }
   histogramDialog.updateToggleLabels();
   histogramDialog.refreshModel();
   histogramDialog.execute();
}

var histogramDialog;
main();
// @flow

'use strict';

var React = require('react');
var PropTypes = require('prop-types');
// qr.js doesn't handle error level of zero (M) so we need to do it right,
// thus the deep require.
var QRCodeImpl = require('qr.js/lib/QRCode');
var ErrorCorrectLevel = require('qr.js/lib/ErrorCorrectLevel');

function getBackingStorePixelRatio(ctx: CanvasRenderingContext2D): number {
  return (
    // $FlowFixMe
    ctx.webkitBackingStorePixelRatio ||
    // $FlowFixMe
    ctx.mozBackingStorePixelRatio ||
    // $FlowFixMe
    ctx.msBackingStorePixelRatio ||
    // $FlowFixMe
    ctx.oBackingStorePixelRatio ||
    // $FlowFixMe
    ctx.backingStorePixelRatio ||
    1
  );
}

type Props = {
  value: string,
  size: number,
  level: $Keys<typeof ErrorCorrectLevel>,
  bgColor: string,
  fgColor: string,
};

class QRCode extends React.Component {
  props: Props;
  _canvas: ?HTMLCanvasElement;

  static defaultProps = {
    size: 128,
    level: 'L',
    bgColor: '#FFFFFF',
    fgColor: '#000000',
  };

  static propTypes = {
    imageType: PropTypes.oneOf([undefined, 'image/png']),
    value: PropTypes.string.isRequired,
    size: PropTypes.number,
    level: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
    bgColor: PropTypes.string,
    fgColor: PropTypes.string,
  };

  shouldComponentUpdate(nextProps: Props) {
    return Object.keys(QRCode.propTypes).some(
      k => this.props[k] !== nextProps[k]
    );
  }

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  update() {
    var {value, size, level, bgColor, fgColor} = this.props;

    // We'll use type===-1 to force QRCode to automatically pick the best type
    var qrcode = new QRCodeImpl(-1, ErrorCorrectLevel[level]);
    qrcode.addData(value);
    qrcode.make();

    if (this._canvas != null) {
      var canvas = this._canvas;

      var ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      var cells = qrcode.modules;
      if (cells === null) {
        return;
      }
      var tileW = size / cells.length;
      var tileH = size / cells.length;
      var scale =
        (window.devicePixelRatio || 1) / getBackingStorePixelRatio(ctx);
      canvas.height = canvas.width = size * scale;
      ctx.scale(scale, scale);

      cells.forEach(function(row, rdx) {
        row.forEach(function(cell, cdx) {
          ctx && (ctx.fillStyle = cell ? fgColor : bgColor);
          var w = Math.ceil((cdx + 1) * tileW) - Math.floor(cdx * tileW);
          var h = Math.ceil((rdx + 1) * tileH) - Math.floor(rdx * tileH);
          ctx &&
            ctx.fillRect(
              Math.round(cdx * tileW),
              Math.round(rdx * tileH),
              w,
              h
            );
        });
      });

      var imageType = this.props.imageType;
      if (imageType) {
        var dataUrl = canvas.toDataURL(imageType);
        this.props.onGenerateImage(dataUrl);
      }
    }
  }

  render() {
    var display = this.props.display;
    var size = this.props.size;
    return (
      <canvas
        style={{
          height: size,
          width: size,
          display,
        }}
        height={size}
        width={size}
        ref={(ref: ?HTMLCanvasElement): ?HTMLCanvasElement =>
          this._canvas = ref}
      />
    );
  }
};

const ConditionalImage = function ({
  dataUrl,
  size,
}) {
  const style = {
    height: size,
    width: size,
  };
  if (dataUrl) {
    return (
      <img
        style={style}
        src={dataUrl}
      />
    );
  } else {
    return (
      <div
        style={style}
      >
        正在加载
        二维码
      </div>
    );
  }
};

class QRCodeWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataUrl: null,
    };
  }
  handleGenerateImage(dataUrl) {
    if (this.props.imageType) {
      this.setState({
        dataUrl,
      });
    }
  }
  render() {
    var imageType = this.props.imageType;
    const size = this.props.size;
    var qrCode = (
      <QRCode
        value={this.props.value}
        size={size}
        level={this.props.level}
        bgColor={this.props.bgColor}
        fgColor={this.props.fgColor}
        display={imageType ? 'none' : 'inline'}
        imageType={this.props.imageType}
        onGenerateImage={(x) => this.handleGenerateImage(x)}
      />
    );
    if (imageType) {
      return (
        <div>
          {qrCode}
          <ConditionalImage
            size={size}
            dataUrl={this.state.dataUrl}
          />
        </div>
      );
    } else {
      return qrCode;
    }
  }
};

module.exports = QRCodeWrapper;

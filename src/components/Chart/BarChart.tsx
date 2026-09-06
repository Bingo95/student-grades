// @ts-nocheck
import { useEffect, useRef } from 'react';
import { Canvas, Chart, Interval, Tooltip, Axis } from '@antv/f2';

// https://f2.antv.antgroup.com

export default ({ boxId = 'container-bar', data = [], xKey = '', yKey = '' }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    initDraw(data);
  }, [data]);

  const initDraw = (value = []) => {
    const width = boxId ? document.getElementById(boxId).offsetWidth : null; // 获取dom的外部宽度
    const height = boxId ? document.getElementById(boxId).offsetHeight : null; // 获取dom的外部高度

    const context = document.getElementById('container-bar').getContext('2d');
    const { props } = (
      <Canvas width={width} height={height} context={context} pixelRatio={window.devicePixelRatio}>
        <Chart data={value}>
          <Axis field={xKey} />
          <Axis field={yKey} />
          <Interval x={xKey} y={yKey} />
          <Tooltip />
        </Chart>
      </Canvas>
    );

    if (!chartRef.current) {
      chartRef.current = new Canvas(props);
      chartRef.current.render();
    } else {
      chartRef.current.update(props);
    }
  };

  return <canvas ref={canvasRef} id="container-bar"></canvas>;
};

// @ts-nocheck
// F2 v5 的 Canvas 需要以命令式方式挂载（与 BarChart 一致），JSX 仅用于收集 props
import { useCallback, useEffect, useRef } from 'react';
import { Axis, Canvas, Chart, Line, Point, Tooltip } from '@antv/f2';
import { pxToVw } from '@/utils/utils';

export interface LineChartProps {
  /** 外层容器 id，必填且在页面内唯一，用于测量宽高 */
  boxId: string;
  /** 图表数据 */
  data?: Array<Record<string, any>>;
  /** x 轴字段 */
  xKey?: string;
  /** y 轴字段 */
  yKey?: string;
  /** 容器高度（px，不参与 px→vw 转换） */
  height?: number;
  /** 折线主色 */
  color?: string;
  /** y 轴刻度数量 */
  tickCount?: number;
  /** 是否平滑曲线 */
  smooth?: boolean;
  /** 是否显示数据点 */
  showPoint?: boolean;
}

const AXIS_LABEL_COLOR = '#8e8e93';
const GRID_COLOR = '#f0f0f4';

/**
 * 通用折线图（@antv/f2 v5）
 * 用法：外层容器给定宽度，内部 canvas 自适应容器宽高
 */
export default function LineChart({
  boxId,
  data = [],
  xKey = 'label',
  yKey = 'value',
  height = 200,
  color = '#007aff',
  tickCount = 4,
  smooth = true,
  showPoint = true,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const dataKey = JSON.stringify(data);

  const draw = useCallback(() => {
    const wrapper = document.getElementById(boxId);
    const canvas = canvasRef.current;
    const value = dataRef.current;
    if (!wrapper || !canvas || !value.length) return;

    const width = wrapper.clientWidth;
    const chartHeight = wrapper.clientHeight || height;
    if (!width || !chartHeight) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = chartHeight * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${chartHeight}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { props } = (
      <Canvas width={width} height={chartHeight} context={context} pixelRatio={pixelRatio}>
        <Chart data={value}>
          <Axis
            field={xKey}
            tickCount={Math.min(value.length, 5)}
            style={{
              label: { fill: AXIS_LABEL_COLOR },
              line: { stroke: GRID_COLOR },
            }}
          />
          <Axis
            field={yKey}
            tickCount={tickCount}
            style={{
              label: { fill: AXIS_LABEL_COLOR },
              grid: { stroke: GRID_COLOR },
            }}
          />
          <Line
            x={xKey}
            y={yKey}
            shape={smooth ? 'smooth' : 'line'}
            style={{ stroke: color, lineCap: 'round' }}
          />
          {showPoint && <Point x={xKey} y={yKey} style={{ fill: '#ffffff', stroke: color }} />}
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
  }, [boxId, height, xKey, yKey, color, tickCount, smooth, showPoint, dataKey]);

  useEffect(() => {
    // 容器可能在弹窗/懒渲染后才 measurable，延迟一帧保证拿到宽高
    const timer = window.setTimeout(draw, 0);
    return () => window.clearTimeout(timer);
  }, [draw]);

  // 尺寸变化时重绘
  useEffect(() => {
    const onResize = () => {
      chartRef.current?.destroy?.();
      chartRef.current = null;
      draw();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  useEffect(
    () => () => {
      chartRef.current?.destroy?.();
      chartRef.current = null;
    },
    [],
  );

  return (
    <div id={boxId} className="line-chart" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

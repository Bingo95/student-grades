import { ReactNode } from 'react';
import { CenterPopup, CenterPopupProps as AntdCenterPopupProps } from 'antd-mobile';

// 定义通用弹窗的 Props 类型
export interface CenterPopupProps
  extends Omit<AntdCenterPopupProps, 'children' | 'visible' | 'onClose'> {
  /** 弹窗是否可见 */
  open: boolean;
  /** 弹窗关闭回调 */
  onClose?: () => void;
  /** 弹窗自定义内容 */
  children?: ReactNode;
  zIndex?: string;
  /** 其他业务参数（示例） */
  [key: string]: any; // 保留任意扩展字段
}
/**
 * 弹窗组件
 */
export default ({ open, onClose, children, zIndex = '3000', ...restProps }: CenterPopupProps) => {
  // 统一的关闭处理函数
  const handleClose = () => {
    onClose?.();
  };

  return (
    <CenterPopup
      visible={open}
      destroyOnClose
      closeOnMaskClick
      onClose={handleClose}
      // maskStyle={{ background: 'rgba(0, 0, 0, 0.85)' }}
      style={{ '--background-color': 'transparent', '--max-width': '100vw', '--z-index': zIndex }}
      {...restProps} // 透传 CenterPopup 其他原生属性
    >
      {children}
    </CenterPopup>
  );
};

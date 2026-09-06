import { ReactNode } from 'react';
import { Popup, PopupProps as AntdPopupProps } from 'antd-mobile';

// 定义通用弹窗的 Props 类型
export interface PopupProps extends Omit<AntdPopupProps, 'children' | 'visible' | 'onClose'> {
  /** 弹窗是否可见 */
  open: boolean;
  /** 弹窗关闭回调 */
  onClose?: () => void;
  /** 弹窗自定义内容 */
  children?: ReactNode;
  /** 其他业务参数（示例） */
  [key: string]: any; // 保留任意扩展字段
}
/**
 * 弹窗组件
 */
export default ({ open, onClose, children, ...restProps }: PopupProps) => {
  // 统一的关闭处理函数
  const handleClose = () => {
    onClose?.();
  };

  return (
    <Popup
      visible={open}
      destroyOnClose
      closeOnMaskClick
      onClose={handleClose}
      style={
        {
          '--adm-color-background': 'transparent',
          '--z-index': '3000',
        } as any
      }
      {...restProps} // 透传 CenterPopup 其他原生属性
    >
      {children}
    </Popup>
  );
};

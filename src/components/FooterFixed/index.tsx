import { SafeArea } from 'antd-mobile';
import './index.less';

/**
 * 底部悬浮按钮容器
 * ios安全区
 * @param {*} children
 */
export default ({ className = '', children }: any) => {
  return (
    <div className="wd_footer_block">
      <SafeArea position="bottom"></SafeArea>
      <div className={`wd_footer_btn_box ${className}`}>
        <div className="wd_footer_btn">{children}</div>
        <SafeArea position="bottom"></SafeArea>
      </div>
    </div>
  );
};

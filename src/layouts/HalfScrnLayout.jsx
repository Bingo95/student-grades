import { Outlet } from '@umijs/max';
import styles from './index.less';

export default function HalfScrnBasicLayout() {
  const onClose = () => {
    console.log('关闭');
  };

  return (
    <>
      <div className={styles.shadow} onClick={onClose}></div>
      <div className={styles.container}>
        <Outlet />
      </div>
    </>
  );
}

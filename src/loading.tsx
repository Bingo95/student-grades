import { SpinLoading } from 'antd-mobile';
// loading components from code split
// https://umijs.org/plugin/umi-plugin-react.html#dynamicimport

const DomLoading = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      position: 'absolute',
    }}
  >
    <SpinLoading color="primary" />
  </div>
);

export default DomLoading;

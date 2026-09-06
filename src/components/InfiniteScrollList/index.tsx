import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { InfiniteScroll } from 'antd-mobile';
import { useMemoizedFn, useUnmount } from 'ahooks';
import styles from './index.less';

export interface LoadDataRetuen<T> {
  list: T[];
  total: number;
  [key: string]: any;
}
export interface InfiniteScrollListProps<T> {
  loadData: ({ pageIndex, pageSize, ...res }: any) => Promise<LoadDataRetuen<T>>;
  params?: object;
  pageSize?: number;
  className?: string;
  loading?: boolean;
  renderItem: (item: any, index: number) => React.ReactNode;
}
export interface InfiniteScrollListRef {
  reload: () => void; // 刷新列表 清空数据从第一页开始
  getList: () => any[]; // 获取当前数据
}

function RecordInfiniteScrollListInternal<T>(
  {
    loadData, // 获取数据的函数 返回一个包含列表和可选的 total/pageSize/pageIndex 的 promise
    renderItem, // 渲染每一项的函数
    pageSize = 20, // 初始页大小（默认 20）
    loading = false, // 是否正在请求
    params = {}, // 额外参数
    className, // 容器的自定义类名
  }: InfiniteScrollListProps<T>,
  ref: React.Ref<InfiniteScrollListRef>,
) {
  // 数据状态
  const [list, setList] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);

  const fetchGetData = useMemoizedFn(async (isRefresh = false) => {
    if (loading) return;

    const currentPage = isRefresh ? 1 : pageIndex;
    const res = await loadData({ pageIndex: currentPage, pageSize, ...params });

    const { list: newList = [], total = 0 } = res;

    if (isRefresh) {
      setList(newList);
      setPageIndex(2);
    } else {
      setList((prev) => [...prev, ...newList]);
      setPageIndex((prev) => prev + 1);
    }

    setHasMore(currentPage * pageSize < total);
  });

  // 加载更多
  const handleLoadMore = useMemoizedFn(async () => {
    if (!hasMore || loading) return;
    await fetchGetData(false);
  });

  // 暴露 ref 方法
  useImperativeHandle(ref, () => ({
    reload: () => {
      setList([]);
      fetchGetData(true);
    },
    getList: () => list,
  }));

  useUnmount(() => {
    setList([]);
    setPageIndex(1);
    fetchGetData(true);
  });

  return (
    <div className={`${styles.scroll_wrap} ${className || ''}`}>
      {list.map((item, index) => renderItem(item, index))}
      <InfiniteScroll loadMore={handleLoadMore} hasMore={hasMore} />
    </div>
  );
}

export default forwardRef(RecordInfiniteScrollListInternal) as <T>(
  props: InfiniteScrollListProps<T> & { ref?: React.Ref<InfiniteScrollListRef> },
) => React.ReactElement;

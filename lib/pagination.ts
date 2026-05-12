export function getTotalPages(totalRecords: number, pageSize: number) {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalRecords / pageSize));
}

export function getPaginationMeta(totalRecords: number, pageSize: number, currentPage: number) {
  const totalPages = getTotalPages(totalRecords, pageSize);
  const clampedPage = Math.max(1, Math.min(currentPage, totalPages));

  return {
    totalPages,
    currentPage: clampedPage,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < totalPages,
    shouldShowControls: totalPages > 1,
  };
}
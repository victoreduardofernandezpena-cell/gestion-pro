export const DEFAULT_PAGINATION = { page: 1, limit: 25, total: 0, totalPages: 1 };

export const normalizePaginatedResult = (result, fallback = DEFAULT_PAGINATION) => {
  if (Array.isArray(result)) {
    return {
      rows: result,
      meta: { ...fallback, total: result.length, totalPages: result.length > fallback.limit ? Math.ceil(result.length / fallback.limit) : 1 }
    };
  }

  if (Array.isArray(result?.data)) {
    return {
      rows: result.data,
      meta: { ...fallback, ...result.meta }
    };
  }

  if (Array.isArray(result?.logs)) {
    return {
      rows: result.logs,
      meta: {
        ...fallback,
        page: result.page || fallback.page,
        limit: result.limit || fallback.limit,
        total: result.total || 0,
        totalPages: result.totalPages || 1
      }
    };
  }

  return { rows: [], meta: fallback };
};

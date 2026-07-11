export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export const hasPaginationQuery = (query = {}) => query.page !== undefined || query.limit !== undefined;

export const parsePagination = (query = {}, { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {}) => {
  const page = Math.max(Number.parseInt(query.page || "1", 10) || 1, 1);
  const rawLimit = Math.max(Number.parseInt(query.limit || String(defaultLimit), 10) || defaultLimit, 1);
  const limit = Math.min(rawLimit, maxLimit);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit
  };
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1)
});

export const findManyMaybePaginated = async (model, args, query = {}, options = {}) => {
  if (!hasPaginationQuery(query)) {
    return model.findMany(args);
  }

  const pagination = parsePagination(query, options);
  const [data, total] = await Promise.all([
    model.findMany({ ...args, skip: pagination.skip, take: pagination.take }),
    model.count({ where: args.where })
  ]);

  return {
    data,
    meta: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
  };
};

import api from "./api";

const get = async (url, params = {}) => (await api.get(url, { params })).data;
const post = async (url, data) => (await api.post(url, data)).data;
const put = async (url, data) => (await api.put(url, data)).data;
const patch = async (url, data = {}) => (await api.patch(url, data)).data;
const del = async (url) => (await api.delete(url)).data;

export const getHrSummary = () => get("/hr/summary");

export const getDepartments = () => get("/hr/departments");
export const createDepartment = (data) => post("/hr/departments", data);
export const updateDepartment = (id, data) => put(`/hr/departments/${id}`, data);
export const changeDepartmentStatus = (id, isActive) => patch(`/hr/departments/${id}/status`, { isActive });
export const deleteDepartment = (id) => del(`/hr/departments/${id}`);

export const getPositions = () => get("/hr/positions");
export const createPosition = (data) => post("/hr/positions", data);
export const updatePosition = (id, data) => put(`/hr/positions/${id}`, data);
export const changePositionStatus = (id, isActive) => patch(`/hr/positions/${id}/status`, { isActive });
export const deletePosition = (id) => del(`/hr/positions/${id}`);

export const getEmployees = (params = {}) => get("/hr/employees", params);
export const getEmployee = (id) => get(`/hr/employees/${id}`);
export const createEmployee = (data) => post("/hr/employees", data);
export const updateEmployee = (id, data) => put(`/hr/employees/${id}`, data);
export const changeEmployeeStatus = (id, data) => patch(`/hr/employees/${id}/status`, data);
export const deleteEmployee = (id) => del(`/hr/employees/${id}`);

export const getAttendance = (params = {}) => get("/hr/attendance", params);
export const createAttendance = (data) => post("/hr/attendance", data);
export const updateAttendance = (id, data) => put(`/hr/attendance/${id}`, data);
export const deleteAttendance = (id) => del(`/hr/attendance/${id}`);

export const getPayrolls = (params = {}) => get("/hr/payrolls", params);
export const getPayroll = (id) => get(`/hr/payrolls/${id}`);
export const createPayroll = (data) => post("/hr/payrolls", data);
export const approvePayroll = (id) => patch(`/hr/payrolls/${id}/approve`);
export const payPayroll = (id, data) => patch(`/hr/payrolls/${id}/pay`, data);
export const cancelPayroll = (id) => patch(`/hr/payrolls/${id}/cancel`);

export const getEmployeePayments = (params = {}) => get("/hr/payments", params);
export const createEmployeePayment = (data) => post("/hr/payments", data);

export const getPayrollReport = (params = {}) => get("/hr/reports/payroll", params);
export const getAttendanceReport = (params = {}) => get("/hr/reports/attendance", params);
export const getEmployeesReport = () => get("/hr/reports/employees");

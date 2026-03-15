const API_BASE_URL = import.meta.env.VITE_API_URL || "";

function resolveUrl(path) {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    return path || API_BASE_URL;
  }
  return API_BASE_URL
    ? `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`
    : path;
}

function getToken() {
  return localStorage.getItem("token");
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers: custom, withAuth = true, ...rest } = options;
  const headers = { ...(custom || {}) };
  const isFormData = body instanceof FormData;

  if (body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return fetch(resolveUrl(path), {
    method,
    headers,
    body: body && !isFormData ? JSON.stringify(body) : body,
    ...rest,
  });
}

export async function apiJson(path, options = {}) {
  const response = await apiRequest(path, options);
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && options.withAuth !== false) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return;
    }

    const rawMessage = data && typeof data.message === "string" ? data.message : "Yêu cầu không thành công";
    const message = translateError(rawMessage);
    
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function translateError(msg) {
  if (!msg) return "Đã xảy ra lỗi không xác định.";
  const m = String(msg).toLowerCase();

  // Auth
  if (m.includes("invalid") && (m.includes("token") || m.includes("credential"))) return "Thông tin đăng nhập không hợp lệ.";
  if (m.includes("deactivated")) return "Tài khoản của bạn đã bị vô hiệu hóa.";
  if (m.includes("unauthorized") || m.includes("access denied")) return "Bạn không có quyền thực hiện hành động này.";

  // CRUD & Data
  if (m.includes("already exists")) {
    if (m.includes("asset type")) return "Tên loại tài sản này đã tồn tại.";
    if (m.includes("building")) return "Tên tòa nhà này đã tồn tại.";
    return "Dữ liệu này đã tồn tại trong hệ thống.";
  }

  if (m.includes("not found")) {
    if (m.includes("asset type")) return "Không tìm thấy loại tài sản.";
    if (m.includes("asset")) return "Không tìm thấy tài sản.";
    return "Không tìm thấy dữ liệu yêu cầu.";
  }

  if (m.includes("required")) return "Vui lòng điền đầy đủ các thông tin bắt buộc.";
  if (m.includes("linked to") || m.includes("cannot delete")) return "Không thể xóa dữ liệu này vì đang có ràng buộc liên quan.";

  // Network/Server
  if (m.includes("failed to fetch") || m.includes("network error")) return "Lỗi kết nối mạng. Vui lòng kiểm tra lại.";
  if (m.includes("internal server error") || m.includes("500")) return "Lỗi hệ thống từ máy chủ. Vui lòng thử lại sau.";

  return msg; // Return original if no match
}

export const api = {
  get: (path) => apiJson(path),
  post: (path, data) => apiJson(path, { method: "POST", body: data }),
  put: (path, data) => apiJson(path, { method: "PUT", body: data }),
  patch: (path, data) => apiJson(path, { method: "PATCH", body: data }),
  delete: (path) => apiJson(path, { method: "DELETE" }),
};

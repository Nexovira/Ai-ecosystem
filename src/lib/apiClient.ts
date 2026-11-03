/**
 * Safe API request utility that guarantees predictable JSON responses across all HTTP statuses,
 * avoiding "Unexpected token 'A', 'A server e'... is not valid JSON" syntax errors on HTML/plain-text responses.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  status: number;
}

export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    const status = res.status;

    let bodyData: any = null;

    if (contentType.includes('application/json')) {
      try {
        bodyData = await res.json();
      } catch {
        bodyData = null;
      }
    } else {
      // Handle plain-text or HTML server errors (e.g., 500 "A server error has occurred")
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        return {
          success: false,
          status,
          error: text.slice(0, 300) || `Request failed with status ${status}`,
          code: `HTTP_${status}`,
        };
      }
    }

    if (bodyData && typeof bodyData === 'object') {
      const isSuccess = bodyData.success !== false && res.ok;
      return {
        ...bodyData,
        success: isSuccess,
        status,
        data: bodyData.data !== undefined ? bodyData.data : bodyData,
        error: isSuccess ? undefined : (bodyData.error || bodyData.message || `Request failed (${status})`),
      };
    }

    if (!res.ok) {
      return {
        success: false,
        status,
        error: `Server responded with status ${status}`,
        code: `HTTP_${status}`,
      };
    }

    return {
      success: true,
      status,
      data: bodyData as T,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network request failed';
    return {
      success: false,
      status: 0,
      error: errorMsg,
      code: 'NETWORK_ERROR',
    };
  }
}

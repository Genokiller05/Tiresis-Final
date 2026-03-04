import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP que agrega el header x-admin-id a todas las peticiones.
 * Esto permite que el backend identifique al admin autenticado
 * y filtre los datos correspondientes (multi-tenant).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Solo en el navegador (no en SSR)
    if (typeof sessionStorage !== 'undefined') {
        const userStr = sessionStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    const cloned = req.clone({
                        setHeaders: {
                            'x-admin-id': user.id
                        }
                    });
                    return next(cloned);
                }
            } catch (e) {
                console.error('[AuthInterceptor] Error parsing currentUser:', e);
            }
        }
    }

    return next(req);
};

import { Product, OrderOP } from '../types';

/**
 * Calculates total reserved quantity for a product across all active reserved Orders (OP in 'Reservado' state)
 */
export function getReservedQtyForProduct(
  product: Partial<Product> & { id: number | string; codigo?: string; nombre?: string },
  ordersOP: OrderOP[]
): number {
  if (!ordersOP || !ordersOP.length) return 0;

  let totalReserved = 0;
  ordersOP.forEach((order) => {
    if (order.estado === 'Reservado' && order.items && order.items.length) {
      order.items.forEach((item) => {
        const matchId = item.productId !== undefined && (item.productId === product.id || String(item.productId) === String(product.id));
        const matchCode = Boolean(item.codigo && product.codigo && item.codigo === product.codigo);
        const matchName = Boolean(item.nombre && product.nombre && item.nombre.toLowerCase().trim() === product.nombre.toLowerCase().trim());

        if (matchId || matchCode || matchName) {
          totalReserved += item.cantidad || 0;
        }
      });
    }
  });

  return totalReserved;
}

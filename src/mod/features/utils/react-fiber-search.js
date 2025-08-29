// https://gist.github.com/0xdevalias/8c621c5d09d780b1d321bfdb86d67cdd#react-internals
// Поиск свойств в дереве react dom. Нужно для стабильного получения состояния плеера и прочих компонентов.

/**
 * Find the React Fiber node associated with a DOM element.
 * @param {HTMLElement} element - The DOM element to inspect.
 * @returns {Object|null} The Fiber node or null if not found.
 */
function findFiberNode(element) {
  const fiberKey = Object.keys(element).find((key) => key.startsWith("__reactFiber$"));
  return fiberKey ? element[fiberKey] : null;
}

/**
 * Traverse up the React Fiber tree to find the root Fiber node.
 * @param {Object} fiber - The starting Fiber node.
 * @returns {Object|null} The root Fiber node or null if not found.
 */
function getRootFiber(fiber) {
  let current = fiber;
  while (current?.return) {
    current = current.return;
  }
  return current || null;
}

/**
 * Traverse and inspect the React Fiber tree.
 * @param {Object} fiber - The starting Fiber node.
 * @param {Function} isFoundCallback - A function to call for each Fiber node.
 * @param {number} depth - Used internally for recursive depth tracking.
 * @returns {any} The result if found, null otherwise.
 */
function traverseFiber(fiber, isFoundCallback, depth = 0) {
  if (!fiber) return null;

  const result = isFoundCallback(fiber, depth);
  if (result !== null && result !== undefined) return result;

  // Check child fibers
  const childResult = traverseFiber(fiber.child, isFoundCallback, depth + 1);
  if (childResult !== null && childResult !== undefined) return childResult;

  // Check sibling fibers
  const siblingResult = traverseFiber(fiber.sibling, isFoundCallback, depth);
  if (siblingResult !== null && siblingResult !== undefined) return siblingResult;

  return null;
}

export function searchProperty(element, property) {
  if (!element) throw "Element is not defined.";

  const fiberNode = findFiberNode(element);

  if (fiberNode) {
    const rootFiber = getRootFiber(fiberNode);

    // рекурсивный поиск до тех пор, пока функция поиска не найдет свойство
    const result = traverseFiber(rootFiber, (fiber, depth) => {
      if (fiber.memoizedProps && fiber.memoizedProps.hasOwnProperty(property)) {
        return fiber.memoizedProps;
      }
      return null;
    });

    return result;
  } else {
    throw "Fiber node not found for the given element.";
  }
}

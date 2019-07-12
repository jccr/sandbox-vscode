// @ts-ignore
export function getAttributes(el) {
  return (
    Array.from(el.attributes)
      // @ts-ignore
      .map(a => [a.name, a.value])
      .reduce((acc, attr) => {
        // @ts-ignore
        acc[attr[0]] = attr[1];
        return acc;
      }, {})
  );
}

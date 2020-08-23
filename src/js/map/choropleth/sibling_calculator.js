export function SiblingCalculator(args) {
    const universe = Object.entries(args.data).reduce((total, c) => {
        return total + c[1];
    }, 0)


    const result = Object.entries(args.data).map(childGeography => {
        const code = childGeography[0];
        const count = childGeography[1];
        const val = count / universe;
        return {code: code, val: val};
    })

    return result
}

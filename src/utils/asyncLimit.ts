type AsyncFunction = (arg?: any) => Promise<any>;
function chunkArray(arr: any[], chunkSize: number): any[][] {
    let index = 0;
    let arrayLength = arr.length;
    let tempArray = [];

    for (index = 0; index < arrayLength; index += chunkSize) {
        let myChunk = arr.slice(index, index + chunkSize);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }
    return tempArray;
}
export const asyncAllLimit = (_fn: AsyncFunction, arr: any[], limit: number) => {
    async function fn(els: any[]): Promise<any[]> {
        return Promise.all(els.map(el => _fn(el)));
    }
    return asyncAllLimitForBrowserFunction(fn, arr, limit);

};
export async function asyncAllLimitForBrowserFunction(asyncFn: AsyncFunction, arr: any[], limit: number): Promise<any[]> {
    if (arr.length === 0) {
        return Promise.resolve([]);
    }
    const chunkedArray = chunkArray(arr, limit);
    const _pipeAsyncStuff = (_chunkedArray: any[][], i: number, asyncFunc: AsyncFunction, acc: any[] = []): Promise<any[]> => {
        console.log(`${asyncFunc.name}: treating chunk ${i}...`);

        return asyncFunc(_chunkedArray[i])
        // launch async function on all elements of first chunk
        // do it on next chunk or resolve promise if there is none
        .then(result => {
            acc = acc.concat(result);
            const nextChunk = _chunkedArray[i + 1];
            if (nextChunk) {
                return _pipeAsyncStuff(_chunkedArray, i + 1, asyncFunc, acc);
            } else {
                return Promise.resolve(acc);
            }
        });
    };
    return _pipeAsyncStuff(chunkedArray, 0, asyncFn);
}

type AsyncFunction = (arg?: any) => Promise<void>;
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

export async function asyncAllLimit(asyncFn: AsyncFunction, arr: any[], limit: number): Promise<void> {
    if (arr.length === 0) {
        return Promise.resolve();
    }
    const chunkedArray = chunkArray(arr, limit);
    const _pipeAsyncStuff = (_chunkedArray: any[][], i: number, asyncFunc: AsyncFunction ): Promise<void> => {
        console.log(`treating chunk ${i}...`);
        return asyncFunc(_chunkedArray[i])
        // launch async function on all elements of first chunk
        // do it on next chunk or resolve promise if there is none
        .then(() => {
            const nextChunk = _chunkedArray[i + 1];
            if (nextChunk) {
                return _pipeAsyncStuff(_chunkedArray, i + 1, asyncFunc);
            } else {
                return Promise.resolve();
            }
        });
    };
    return _pipeAsyncStuff(chunkedArray, 0, asyncFn);
}

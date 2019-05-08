let tmp = {};
export async function save(data: any, key: string): Promise<void> {
    // we want to throw if we call it while data already exists
    if (tmp[key]) {
        return Promise.reject(new Error('temp file for this already exists, should not call save'));
    }
    tmp[key] = JSON.stringify(data);
}

export async function get(key: string): Promise<any> {
    const haveData = Object.keys(tmp).indexOf(key) > -1;
    const result = haveData ? JSON.parse(tmp[key]) : false;
    return result;
}

var obj = {
    a: 1,
    b: 2
};
let ndd = { f: 'a', L: 'b' };
console.log(Object.keys(obj).includes(ndd?.f));
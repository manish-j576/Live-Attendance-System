let obj1 = {}

let obj2 = {
    name : "manish"
}
let obj4 = {
    age : 21
}

let obj3 = {...obj1 , ...obj2}
obj3 = {...obj3,...obj4}
console.log(obj3)
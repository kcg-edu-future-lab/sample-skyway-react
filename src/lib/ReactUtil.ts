import { useEffect, useRef, useState } from "react";

export function useEffectOnce(effect: ()=>((()=>void) | void)){
    const first = useRef(true);
    useEffect(()=>{
        if(!first.current) return;
        first.current = false;
        return effect();
    }, []);
}

export function useStaticInstance<T>(factory: ()=>T): T | null{
    const [client, setClient] = useState<T | null>(null);
    useEffectOnce(()=>{
        setClient(factory());
    });
    return client;
}

type NonNullables<T extends unknown[]> = 
    T extends [infer U, ...infer V] ?
    [NonNullable<U>, ...NonNullables<V>] :
    NonNullable<T>;
export function useEffectAfterInstancesReady<T extends unknown[]>(
        depends: [...T], effect: (...arg: NonNullables<T>)=>((()=>void) | void)){
    const first = useRef(true);
    useEffect(()=>{
        if(!first.current) return;
        if(depends.filter(d=>d===null).length > 0) return;
        first.current = false;
        return effect(...(depends as NonNullables<T>));
    }, []);
}

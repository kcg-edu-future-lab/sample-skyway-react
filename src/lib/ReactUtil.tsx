import { useRef } from "react";

export function useRefWithInit<T>(initializer: ()=>T){
    const ref = useRef<T>();

    if(!ref.current){
        ref.current = initializer();
    }
    return ref;
}

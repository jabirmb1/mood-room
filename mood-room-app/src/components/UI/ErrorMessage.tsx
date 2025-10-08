/***** a very lightwight component to display error messages consistenntly within a program */

import { errorMessageStyle } from "@/utils/UI/const";
import { ReactNode } from "react";

export function ErrorMessage({children}:{children:ReactNode}){
    return(
        <div className={errorMessageStyle}>
            {children}
        </div>
    )
}
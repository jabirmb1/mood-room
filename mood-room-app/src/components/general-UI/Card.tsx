/********Simple card component which performs an action when clicked (button with image + text)
 * or goes to a different page (acts as a link) ***/

import Image from 'next/image'
import Link from 'next/link'
import placeHolderLight from '../../../public/assets/Images/placeHolderLight.svg'
import placeHolderDark from '../../../public/assets/Images/placeHolderDark.svg'
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { darkTheme, lightTheme } from '@/utils/UI/const';

type CardProps = {
    imageUrl: string | null;// url of image
    text: string;// what should the text say
    href?: string; // If provided, renders as Link. If not, renders as button with onClick
    onClick?: () => any; // Only used if href is not provided
    textSize?: number | string;// tailwind css number or size for text.
    width?: number;// width of image (and hence also card)
    height?: number;// height of image(and hence also card)
    textLocation?: 'top' | 'bottom';// should text be above or below the image
    disabled?: boolean;// is it disabled or not
    ariaLabel?: string;// label for aria support.
    openInNewTab?: boolean; // Only applies when href is provided
}

export function Card({imageUrl, text,href,onClick,textSize = 16, width = 200, height = 200, 
    textLocation = "bottom",disabled = false,ariaLabel,openInNewTab = false}: CardProps) {

    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = mounted ? (resolvedTheme || theme) : 'light';
    const placeHolder = currentTheme === 'dark' ? placeHolderDark : placeHolderLight;
    const image = imageUrl || placeHolder;

    // our text element so we can use it in multiple places easily
    const textElement = (
        <span 
            className={`${theme === 'dark' ? darkTheme : lightTheme} 
            ${textLocation === 'top' ? 'mb-2' : 'mt-2'} text-${textSize}`}
        >
            {text}
        </span>
    );

    const imageElement = (
        <Image 
            src={image} 
            alt={imageUrl ? text : 'placeholder image'}
            width={width}
            height={height}
            className="object-contain"
        />
    );

    // the actual content of our buttons/ Links(anchor tags)
    const content = (
        <>
            {textLocation === 'top' && textElement}
            {imageElement}
            {textLocation === 'bottom' && textElement}

        </>
    );

    const baseClassName = "flex flex-col items-center gap-2 p-4 border rounded transition-colors" +  
    "hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" +
    "focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // probs to pass into motion component to keep it resusable.
    const motionProps = {
        whileHover: {
            y: -5,
            scale: 1.02,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        whileTap: {
            scale: 0.98,
        },
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 10,
        }
    };

    // Render as Link for navigation
    if (href) {
        const linkProps = openInNewTab 
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {};

        return (
            <Link href={href} {...linkProps} aria-label={ariaLabel || text}>
                <motion.div
                    className={baseClassName}
                    {...motionProps}
                >
                    {content}
                </motion.div>
            </Link>
        );
    }

    // Render as button for actions
    return (
        <motion.button 
            className={baseClassName}
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel || text}
            {...motionProps}
        >
            {content}
        </motion.button>
    );
}
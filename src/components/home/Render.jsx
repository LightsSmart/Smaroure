import React, { useMemo } from "react";
import styles from "./Render.module.css";

function Render({ content }) {
    const getMarkdownText = useMemo(() => {
        const lines = String(content).split(/\r?\n/);

        function checkBlockElement(line) {
            const patterns = [
                /^#{1,6} .+$/,              /* Headers */
                /^!\[.*]\(.*\)$/,           /* Images */
                /^\[.*]\(.*\)$/,            /* Links */
            ];

            return patterns.some(pattern => pattern.test(line));
        }

        function transformLine(line) {
            return line
                // Headings
                .replace(/^### (.*$)/gim, "<h3>$1</h3>")
                .replace(/^## (.*$)/gim, "<h2>$1</h2>")
                .replace(/^# (.*$)/gim, "<h1>$1</h1>")
                // Bold and italic
                .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/gim, "<em>$1</em>")
                // Links and images
                .replace(/!\[(.*?)]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
                .replace(/\[(.*?)]\((.*?)\)/gim, '<a href="$2">$1</a>');
        }

        const html = lines.reduce((acc, line, index, array) => {
            const transformedLine = transformLine(line);

            acc += checkBlockElement(line) ? transformedLine : line.trim() ? `<p>${transformedLine}</p>` : '';

            acc += index < array.length - 1 && !checkBlockElement(array[index + 1]) ? "\n" : '';

            return acc;
        }, '');

        return ({ __html: html });
    }, [content]);

    return !!content ? <div className={styles.render} dangerouslySetInnerHTML={getMarkdownText} /> : null;
}

export default Render;

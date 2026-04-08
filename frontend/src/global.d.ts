declare module '*.module.scss' {
	const classes: { [key: string]: string };
	export default classes;
}

declare module '*.scss' {
	const content: string;
	export default content;
}

declare module '*.png' {
	const value: string;
	export default value;
}

declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';

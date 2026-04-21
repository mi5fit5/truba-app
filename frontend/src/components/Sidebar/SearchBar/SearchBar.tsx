import { useState } from 'react';

import { ActionInput } from '../../ui/ActionInput';

import searchIcon from '../../../assets/icons/search_icon.png';

interface SearchBarProps {
	onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
	const [query, setQuery] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);

		if (e.target.value === '') {
			onSearch('');
		}
	};

	const handleSearchSubmit = () => {
		onSearch(query);
	};

	return (
		<ActionInput
			value={query}
			onChange={handleChange}
			placeholder='поиск...'
			iconSrc={searchIcon}
			iconAlt='Иконка поиска: лупа'
			onAction={handleSearchSubmit}
		/>
	);
};

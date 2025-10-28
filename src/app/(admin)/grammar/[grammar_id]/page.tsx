import React from 'react';
import { useRouter } from 'next/router';
import GrammarDetailView from '@/components/grammar/GrammarDetailView';

const GrammarEntryPage = () => {
    const router = useRouter();
    const { grammar_id } = router.query;

    return (
        <div>
            {grammar_id ? <GrammarDetailView id={grammar_id} /> : <p>Loading...</p>}
        </div>
    );
};

export default GrammarEntryPage;
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Spin, Typography } from 'antd';
import { fetchGrammarEntry } from '@/services/grammarApi';

const { Title, Paragraph } = Typography;

const GrammarDetailView = () => {
    const router = useRouter();
    const { grammar_id } = router.query;
    const [grammarEntry, setGrammarEntry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getGrammarEntry = async () => {
            if (grammar_id) {
                try {
                    const data = await fetchGrammarEntry(grammar_id);
                    setGrammarEntry(data);
                } catch (error) {
                    console.error('Failed to fetch grammar entry:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        getGrammarEntry();
    }, [grammar_id]);

    if (loading) {
        return <Spin size="large" />;
    }

    if (!grammarEntry) {
        return <Paragraph>No grammar entry found.</Paragraph>;
    }

    return (
        <div>
            <Title level={2}>{grammarEntry.pattern.join(' ')}</Title>
            <Paragraph><strong>Pinyin:</strong> {grammarEntry.patternPinyin.join(' ')}</Paragraph>
            <Paragraph><strong>HSK Level:</strong> {grammarEntry.hskLevel}</Paragraph>
            <Paragraph><strong>Formula:</strong> {grammarEntry.patternFormula}</Paragraph>
            <Paragraph><strong>Created At:</strong> {new Date(grammarEntry.createdAt).toLocaleString()}</Paragraph>
        </div>
    );
};

export default GrammarDetailView;
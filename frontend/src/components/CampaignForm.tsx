import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, ArrowLeft, Building2, Globe, Layers } from 'lucide-react';
import api from '../lib/api';
import type { Client, CampaignCreateRequest, JobResponse } from '../types';

const schema = z.object({
    campaign_name: z.string().min(1, 'Campaign name is required'),
    campaign_description: z.string().optional(),
    primary_objective: z.string().min(5, 'Objective required (at least 5 characters)'),
    desired_tone_of_voice: z.string().min(2, 'Tone of voice required'),
});

type FormData = z.infer<typeof schema>;

const OBJECTIVE_SUGGESTIONS = [
    'Brand Awareness', 'Lead Generation', 'Product Launch', 'Rebranding',
    'Customer Retention', 'Sales Conversion', 'Market Expansion',
];

const TONE_SUGGESTIONS = [
    'Bold & Energetic', 'Professional', 'Friendly & Approachable', 'Humorous',
    'Inspirational', 'Authoritative', 'Minimalist & Clean',
];

interface Props {
    clientId: string;
    onJobCreated: (jobId: string) => void;
    onBack: () => void;
}

export default function CampaignForm({ clientId, onJobCreated, onBack }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { data: client } = useQuery<Client>({
        queryKey: ['client', clientId],
        queryFn: () => api.get<Client>(`/clients/${clientId}`).then(r => r.data),
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const objective = watch('primary_objective') ?? '';
    const tone = watch('desired_tone_of_voice') ?? '';

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload: CampaignCreateRequest = {
                client_id: clientId,
                campaign_name: data.campaign_name,
                campaign_description: data.campaign_description,
                primary_objective: data.primary_objective,
                desired_tone_of_voice: data.desired_tone_of_voice,
            };
            const res = await api.post<JobResponse>('/jobs', payload);
            onJobCreated(res.data.job_id);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (typeof detail === 'object' && detail?.feedback) {
                setServerError(Array.isArray(detail.feedback) ? detail.feedback.join(' ') : String(detail.feedback));
            } else {
                setServerError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Client context banner */}
            {client && (
                <div className="bg-[#1E3A5F]/6 border border-[#1E3A5F]/15 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
                        <Building2 size={15} className="text-[#1E3A5F]" />
                    </div>
                    <div>
                        <p className="text-xs text-[#78716C] font-medium uppercase tracking-wider">Creating campaign for</p>
                        <p className="text-sm font-bold text-[#1C1917]">{client.brand_name}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#A8A29E] mt-0.5">
                            <span className="flex items-center gap-1"><Layers size={9} />{client.industry}</span>
                            <span className="flex items-center gap-1"><Globe size={9} />{client.target_country}</span>
                        </div>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-[10px] text-[#A8A29E] uppercase tracking-wider mb-1">AI will choose channels</p>
                        <div className="flex items-center gap-1 text-xs text-[#1E3A5F] font-medium">
                            <Sparkles size={11} />
                            Based on your goal
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 space-y-6">

                    {/* Campaign name */}
                    <div>
                        <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">Campaign Name</label>
                        <input
                            {...register('campaign_name')}
                            placeholder="e.g. Q2 Awareness Push, Summer Launch 2026"
                            className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-colors ${errors.campaign_name ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-[#1E3A5F]'}`}
                        />
                        {errors.campaign_name && <p className="text-xs text-red-500 mt-1">{errors.campaign_name.message}</p>}
                    </div>

                    {/* Campaign description */}
                    <div>
                        <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">
                            Description <span className="text-[#A8A29E] normal-case font-normal">(optional)</span>
                        </label>
                        <textarea
                            {...register('campaign_description')}
                            rows={2}
                            placeholder="Any additional context about this campaign…"
                            className="w-full px-3 py-2.5 text-sm bg-white border border-[#E7E5E4] rounded-lg outline-none focus:border-[#1E3A5F] transition-colors resize-none"
                        />
                    </div>

                    {/* Primary objective */}
                    <div>
                        <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">Campaign Objective</label>
                        <input
                            {...register('primary_objective')}
                            placeholder="e.g. Brand Awareness, Lead Generation, Product Launch"
                            className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-colors ${errors.primary_objective ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-[#1E3A5F]'}`}
                        />
                        {errors.primary_objective && <p className="text-xs text-red-500 mt-1">{errors.primary_objective.message}</p>}
                        {/* Quick suggestions */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {OBJECTIVE_SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setValue('primary_objective', s, { shouldValidate: true })}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                        objective === s
                                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                                            : 'bg-stone-50 text-[#78716C] border-[#E7E5E4] hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone of voice */}
                    <div>
                        <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">Tone of Voice</label>
                        <input
                            {...register('desired_tone_of_voice')}
                            placeholder="e.g. Bold, Professional, Friendly"
                            className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-colors ${errors.desired_tone_of_voice ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-[#1E3A5F]'}`}
                        />
                        {errors.desired_tone_of_voice && <p className="text-xs text-red-500 mt-1">{errors.desired_tone_of_voice.message}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {TONE_SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setValue('desired_tone_of_voice', s, { shouldValidate: true })}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                        tone === s
                                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                                            : 'bg-stone-50 text-[#78716C] border-[#E7E5E4] hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI channels note */}
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                            <span className="font-semibold">Channels are AI-selected.</span> Based on your objective, tone, and {client?.brand_name ?? 'this client'}'s audience profile, our AI will pick the best platforms for your campaign.
                        </p>
                    </div>
                </div>

                {/* Server error */}
                {serverError && (
                    <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-6">
                    <button type="button" onClick={onBack} className="btn-ghost text-sm flex items-center gap-1.5">
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                AI selecting channels…
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} />
                                Launch Campaign
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

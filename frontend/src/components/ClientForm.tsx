import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Upload } from 'lucide-react';
import api from '../lib/api';
import type { Client } from '../types';

const schema = z.object({
    brand_name: z.string().min(1, 'Brand name is required'),
    website_url: z.string().url('Must be a valid URL'),
    target_country: z.string().min(1, 'Country is required'),
    industry: z.string().min(1, 'Industry is required'),
    product_description: z.string().min(10, 'Description must be at least 10 characters'),
    core_problem_solved: z.string().min(5, 'Problem definition required'),
    unique_selling_proposition: z.string().min(5, 'USP is required'),
    demographics: z.string().min(5, 'Demographics required'),
    psychographics: z.string().min(5, 'Psychographics required'),
    cultural_nuances: z.string().optional(),
    main_competitors: z.array(z.string().min(1, 'Competitor name cannot be empty')).min(1, 'List at least 1 competitor'),
    current_marketing_efforts: z.string().optional(),
    known_customer_objections: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
    { label: 'Brand', subtitle: 'Basic identity' },
    { label: 'Product', subtitle: "What you're selling" },
    { label: 'Audience', subtitle: "Who you're targeting" },
    { label: 'Market', subtitle: 'Competitive landscape' },
];

const STEP_FIELDS: (keyof FormData)[][] = [
    ['brand_name', 'website_url', 'target_country', 'industry'],
    ['product_description', 'core_problem_solved', 'unique_selling_proposition'],
    ['demographics', 'psychographics'],
    ['main_competitors'],
];

interface Props {
    onSaved: (client: Client) => void;
    onCancel: () => void;
    initialData?: Client | null;
}

function WInput({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">{label}</label>
            <input
                {...props}
                className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-colors ${error ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-[#1E3A5F]'}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function WTextarea({ label, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">{label}</label>
            <textarea
                {...props}
                rows={3}
                className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-colors resize-none ${error ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-[#1E3A5F]'}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export default function ClientForm({ onSaved, onCancel, initialData }: Props) {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, control, handleSubmit, trigger, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            brand_name: initialData.brand_name,
            website_url: initialData.website_url,
            target_country: initialData.target_country,
            industry: initialData.industry,
            product_description: initialData.product_description,
            core_problem_solved: initialData.core_problem_solved,
            unique_selling_proposition: initialData.unique_selling_proposition,
            demographics: initialData.demographics,
            psychographics: initialData.psychographics,
            cultural_nuances: initialData.cultural_nuances ?? '',
            main_competitors: initialData.main_competitors.length ? initialData.main_competitors : [''],
            current_marketing_efforts: initialData.current_marketing_efforts ?? '',
            known_customer_objections: initialData.known_customer_objections ?? '',
        } : {
            main_competitors: [''],
        },
    });

    const { fields: competitorFields, append: addCompetitor, remove: removeCompetitor } = useFieldArray({
        control,
        name: 'main_competitors' as never,
    });

    const goNext = async () => {
        const valid = await trigger(STEP_FIELDS[step] as (keyof FormData)[]);
        if (valid) setStep(s => s + 1);
    };

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            let res;
            if (initialData) {
                res = await api.put<Client>(`/clients/${initialData.id}`, data);
            } else {
                res = await api.post<Client>('/clients', data);
            }
            onSaved(res.data);
        } catch (err: any) {
            setServerError(err?.response?.data?.detail ?? 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEdit = !!initialData;

    const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setJsonError(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const raw = JSON.parse(ev.target?.result as string);
                // Support both flat (FormData) and nested questionnaire format
                const flat: Partial<FormData> = raw.project_metadata ? {
                    brand_name: raw.project_metadata?.brand_name ?? '',
                    website_url: raw.project_metadata?.website_url ?? '',
                    target_country: raw.project_metadata?.target_country ?? '',
                    industry: raw.project_metadata?.industry ?? '',
                    product_description: raw.product_definition?.product_description ?? '',
                    core_problem_solved: raw.product_definition?.core_problem_solved ?? '',
                    unique_selling_proposition: raw.product_definition?.unique_selling_proposition ?? '',
                    demographics: raw.target_audience?.demographics ?? '',
                    psychographics: raw.target_audience?.psychographics ?? '',
                    cultural_nuances: raw.target_audience?.cultural_nuances ?? '',
                    main_competitors: raw.market_context?.main_competitors ?? [''],
                    current_marketing_efforts: raw.market_context?.current_marketing_efforts ?? '',
                    known_customer_objections: raw.market_context?.known_customer_objections ?? '',
                } : raw;
                reset({ main_competitors: [''], ...flat });
                setStep(0);
            } catch {
                setJsonError('Invalid JSON file. Please check the format and try again.');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be re-imported
        e.target.value = '';
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* JSON import — new clients only */}
            {!isEdit && (
                <div className="flex justify-end mb-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleJsonImport}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1E3A5F] border border-[#E7E5E4] hover:border-[#1E3A5F] bg-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Upload size={12} />
                        Import JSON
                    </button>
                </div>
            )}
            {jsonError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {jsonError}
                </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
                {STEPS.map((s, i) => (
                    <div key={s.label} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2 ${i < step ? 'opacity-60' : ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                i < step ? 'bg-emerald-500 text-white'
                                : i === step ? 'bg-[#1E3A5F] text-white'
                                : 'bg-[#E7E5E4] text-[#A8A29E]'
                            }`}>
                                {i < step ? <CheckCircle2 size={12} /> : i + 1}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-[#1C1917]">{s.label}</p>
                                <p className="text-[10px] text-[#A8A29E]">{s.subtitle}</p>
                            </div>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-px ${i < step ? 'bg-emerald-300' : 'bg-[#E7E5E4]'}`} />
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 space-y-5">

                    {/* Step 0: Brand */}
                    {step === 0 && (
                        <>
                            <WInput
                                label="Brand Name"
                                placeholder="e.g. EcoFlow Bottles"
                                error={errors.brand_name?.message}
                                {...register('brand_name')}
                            />
                            <WInput
                                label="Website URL"
                                placeholder="https://example.com"
                                error={errors.website_url?.message}
                                {...register('website_url')}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <WInput
                                    label="Target Country"
                                    placeholder="e.g. USA, Israel"
                                    error={errors.target_country?.message}
                                    {...register('target_country')}
                                />
                                <WInput
                                    label="Industry"
                                    placeholder="e.g. CPG, SaaS, Retail"
                                    error={errors.industry?.message}
                                    {...register('industry')}
                                />
                            </div>
                        </>
                    )}

                    {/* Step 1: Product */}
                    {step === 1 && (
                        <>
                            <WTextarea
                                label="Product Description"
                                placeholder="What are you selling? Describe it clearly."
                                error={errors.product_description?.message}
                                {...register('product_description')}
                            />
                            <WTextarea
                                label="Core Problem Solved"
                                placeholder="What pain point does your product address?"
                                error={errors.core_problem_solved?.message}
                                {...register('core_problem_solved')}
                            />
                            <WTextarea
                                label="Unique Selling Proposition (USP)"
                                placeholder="Why are you different from competitors?"
                                error={errors.unique_selling_proposition?.message}
                                {...register('unique_selling_proposition')}
                            />
                        </>
                    )}

                    {/* Step 2: Audience */}
                    {step === 2 && (
                        <>
                            <WTextarea
                                label="Demographics"
                                placeholder="Age, gender, location, income level…"
                                error={errors.demographics?.message}
                                {...register('demographics')}
                            />
                            <WTextarea
                                label="Psychographics"
                                placeholder="Interests, values, lifestyle, behavior…"
                                error={errors.psychographics?.message}
                                {...register('psychographics')}
                            />
                            <WTextarea
                                label="Cultural Nuances (optional)"
                                placeholder="Any specific cultural preferences or sensitivities?"
                                {...register('cultural_nuances')}
                            />
                        </>
                    )}

                    {/* Step 3: Market */}
                    {step === 3 && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1.5">Main Competitors</label>
                                <div className="space-y-2">
                                    {competitorFields.map((field, i) => (
                                        <div key={field.id} className="flex gap-2">
                                            <input
                                                {...register(`main_competitors.${i}` as const)}
                                                placeholder={`Competitor ${i + 1}`}
                                                className="flex-1 px-3 py-2 text-sm bg-white border border-[#E7E5E4] rounded-lg outline-none focus:border-[#1E3A5F] transition-colors"
                                            />
                                            {competitorFields.length > 1 && (
                                                <button type="button" onClick={() => removeCompetitor(i)} className="p-2 text-[#A8A29E] hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {(errors.main_competitors as any)?.message && (
                                        <p className="text-xs text-red-500">{(errors.main_competitors as any).message}</p>
                                    )}
                                </div>
                                <button type="button" onClick={() => addCompetitor('')} className="mt-2 flex items-center gap-1.5 text-xs text-[#1E3A5F] hover:underline">
                                    <Plus size={12} /> Add competitor
                                </button>
                            </div>

                            <WTextarea
                                label="Current Marketing Efforts (optional)"
                                placeholder="What are you doing for marketing right now?"
                                {...register('current_marketing_efforts')}
                            />
                            <WTextarea
                                label="Known Customer Objections (optional)"
                                placeholder="Why do potential customers say no to you?"
                                {...register('known_customer_objections')}
                            />
                        </>
                    )}
                </div>

                {/* Server error */}
                {serverError && (
                    <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        type="button"
                        onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}
                        className="btn-ghost text-sm flex items-center gap-1.5"
                    >
                        <ArrowLeft size={14} />
                        {step === 0 ? 'Cancel' : 'Back'}
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button type="button" onClick={goNext} className="btn-primary text-sm">
                            Next
                            <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

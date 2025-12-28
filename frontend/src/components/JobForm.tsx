import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Upload, Plus, Trash2, Send, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import type { QuestionnaireRequest } from '../types';

// --- Zod Schema ---
const schema = z.object({
    project_metadata: z.object({
        brand_name: z.string().min(1, "Brand name is required"),
        website_url: z.string().url("Must be a valid URL"),
        target_country: z.string().min(1, "Target country is required"),
        industry: z.string().min(1, "Industry is required"),
    }),
    product_definition: z.object({
        product_description: z.string().min(10, "Description must be at least 10 chars"),
        core_problem_solved: z.string().min(5, "Problem definition required"),
        unique_selling_proposition: z.string().min(5, "USP is required"),
    }),
    target_audience: z.object({
        demographics: z.string().min(5, "Demographics required"),
        psychographics: z.string().min(5, "Psychographics required"),
        cultural_nuances: z.string().optional(),
    }),
    market_context: z.object({
        main_competitors: z.array(z.string().min(1, "Competitor name cannot be empty")).min(1, "List at least 1 competitor"),
        current_marketing_efforts: z.string().optional(),
        known_customer_objections: z.string().optional(),
    }),
    the_creative_goal: z.object({
        primary_objective: z.string().min(5, "Objective required"),
        desired_tone_of_voice: z.string().min(2, "Tone required"),
        specific_channels: z.array(z.string().min(1, "Channel cannot be empty")).min(1, "List at least 1 channel"),
    }),
});

type FormData = z.infer<typeof schema>;

interface JobFormProps {
    onJobCreated: (jobId: string) => void;
}

const JobForm: React.FC<JobFormProps> = ({ onJobCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            project_metadata: { brand_name: '', website_url: '', target_country: '', industry: '' },
            product_definition: { product_description: '', core_problem_solved: '', unique_selling_proposition: '' },
            target_audience: { demographics: '', psychographics: '', cultural_nuances: '' },
            market_context: { main_competitors: [''], current_marketing_efforts: '', known_customer_objections: '' },
            the_creative_goal: { primary_objective: '', desired_tone_of_voice: '', specific_channels: [''] },
        }
    });

    // arrays for dynamic fields
    const competitors = useFieldArray({ control, name: "market_context.main_competitors" as any });
    const channels = useFieldArray({ control, name: "the_creative_goal.specific_channels" as any });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/jobs', data);
            if (response.status === 201) {
                onJobCreated(response.data.job_id);
            }
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err)) {
                const msg = err.response?.data?.detail
                    ? JSON.stringify(err.response.data.detail)
                    : err.message;
                setError(msg);
            } else {
                setError("Network error. Is the backend running?");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("File Upload Triggered");
        const file = e.target.files?.[0];
        if (!file) {
            console.log("No file selected");
            return;
        }
        console.log("File selected:", file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                console.log("JSON Parsed:", json);
                if (json.project_metadata) {
                    reset(json);
                    setError(null);
                } else {
                    setError("Invalid JSON structure. Missing project_metadata?");
                }
            } catch (err) {
                console.error("JSON Parse Error:", err);
                setError("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset valid so same file can be selected again
        e.target.value = '';
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Start New Campaign
                </h2>
                <div className="relative">
                    <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-sm font-medium border border-slate-700"
                    >
                        <Upload size={16} /> Import JSON
                    </label>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
                    {typeof error === 'string' ? error : JSON.stringify(error)}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, (errors) => console.log("Validation Errors:", errors))} className="space-y-8">

                {/* Section 1: Metadata */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-800 pb-2">1. Project Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Brand Name" registration={register("project_metadata.brand_name")} error={errors.project_metadata?.brand_name} />
                        <Input label="Website URL" registration={register("project_metadata.website_url")} error={errors.project_metadata?.website_url} />
                        <Input label="Target Country" registration={register("project_metadata.target_country")} error={errors.project_metadata?.target_country} />
                        <Input label="Industry" registration={register("project_metadata.industry")} error={errors.project_metadata?.industry} />
                    </div>
                </section>

                {/* Section 2: Product */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-800 pb-2">2. Product Definition</h3>
                    <TextArea label="Product Description" registration={register("product_definition.product_description")} error={errors.product_definition?.product_description} />
                    <Input label="Core Problem Solved" registration={register("product_definition.core_problem_solved")} error={errors.product_definition?.core_problem_solved} />
                    <Input label="Unique Selling Proposition" registration={register("product_definition.unique_selling_proposition")} error={errors.product_definition?.unique_selling_proposition} />
                </section>

                {/* Section 3: Audience */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-800 pb-2">3. Target Audience</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Demographics" registration={register("target_audience.demographics")} error={errors.target_audience?.demographics} />
                        <Input label="Psychographics" registration={register("target_audience.psychographics")} error={errors.target_audience?.psychographics} />
                    </div>
                    <Input label="Cultural Nuances (Optional)" registration={register("target_audience.cultural_nuances")} />
                </section>

                {/* Section 4: Market Context */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-800 pb-2">4. Market Context</h3>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">Main Competitors</label>
                        {competitors.fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <input
                                    {...register(`market_context.main_competitors.${index}` as const)}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    placeholder="Competitor Name"
                                    defaultValue={(field as any).name /* Hack for flat array */}
                                />
                                <button type="button" onClick={() => competitors.remove(index)} className="text-slate-500 hover:text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => competitors.append("New Competitor")} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300">
                            <Plus size={14} /> Add Competitor
                        </button>
                        {errors.market_context?.main_competitors && <p className="text-xs text-red-400">{errors.market_context.main_competitors.message}</p>}
                    </div>

                    <Input label="Current Marketing Efforts (Optional)" registration={register("market_context.current_marketing_efforts")} />
                    <Input label="Known Objections (Optional)" registration={register("market_context.known_customer_objections")} />
                </section>

                {/* Section 5: Goals */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-800 pb-2">5. Creative Goal</h3>
                    <Input label="Primary Objective" registration={register("the_creative_goal.primary_objective")} error={errors.the_creative_goal?.primary_objective} />
                    <Input label="Desired Tone" registration={register("the_creative_goal.desired_tone_of_voice")} error={errors.the_creative_goal?.desired_tone_of_voice} />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">Channels</label>
                        {channels.fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <input
                                    {...register(`the_creative_goal.specific_channels.${index}` as const)}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    placeholder="e.g. TikTok"
                                    defaultValue={(field as any).name}
                                />
                                <button type="button" onClick={() => channels.remove(index)} className="text-slate-500 hover:text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => channels.append("New Channel")} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300">
                            <Plus size={14} /> Add Channel
                        </button>
                        {errors.the_creative_goal?.specific_channels && <p className="text-xs text-red-400">{errors.the_creative_goal.specific_channels.message}</p>}
                    </div>
                </section>


                {Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg animate-pulse">
                        <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                            <AlertCircle size={20} />
                            <span>Please fix the following errors:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                            {Object.keys(errors).map((key) => (
                                <li key={key}>
                                    <span className="capitalize">{key.replace('_', ' ')}</span> contains errors.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    {loading ? "Analyzing..." : "Launch Campaign Analysis"}
                </button>

            </form>
        </div>
    );
};

// UI Helper Components
const Input = ({ label, registration, error }: any) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-400">{label}</label>
        <input
            {...registration}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-700"
        />
        {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
);

const TextArea = ({ label, registration, error }: any) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-400">{label}</label>
        <textarea
            {...registration}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-700 resize-none"
        />
        {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
);

export default JobForm;

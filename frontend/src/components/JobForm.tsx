import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Upload, Plus, Trash2, Send, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

// --- Zod Schema (Same as before) ---
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

const STEPS = [
    { title: "Identity", description: "Who are you?" },
    { title: "Market", description: "Who is it for?" },
    { title: "Launch", description: "What is the goal?" },
];

const JobForm: React.FC<JobFormProps> = ({ onJobCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(0);

    const { register, control, handleSubmit, trigger, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            project_metadata: { brand_name: '', website_url: '', target_country: '', industry: '' },
            product_definition: { product_description: '', core_problem_solved: '', unique_selling_proposition: '' },
            target_audience: { demographics: '', psychographics: '', cultural_nuances: '' },
            market_context: { main_competitors: [''], current_marketing_efforts: '', known_customer_objections: '' },
            the_creative_goal: { primary_objective: '', desired_tone_of_voice: '', specific_channels: [''] },
        }
    });

    const competitors = useFieldArray({ control, name: "market_context.main_competitors" as any });
    const channels = useFieldArray({ control, name: "the_creative_goal.specific_channels" as any });

    // Validate current step before moving next
    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 0) {
            fieldsToValidate = ["project_metadata", "product_definition"];
        } else if (step === 1) {
            fieldsToValidate = ["target_audience", "market_context"];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Submitting job with data:', data);
            const response = await axios.post('/api/jobs', data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Response received:', response.status, response.data);
            if (response.status === 201) {
                onJobCreated(response.data.job_id);
            }
        } catch (err: any) {
            console.error('Error submitting job:', err);
            if (axios.isAxiosError(err)) {
                console.error('Axios error details:', {
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data,
                    url: err.config?.url,
                });
                
                if (err.response?.status === 404) {
                    setError(`404 Not Found: ${err.config?.url}. Make sure the backend is running on port 8000.`);
                } else if (err.response?.status === 400) {
                    // Validation error from backend
                    const detail = err.response.data?.detail;
                    if (detail && typeof detail === 'object' && 'feedback' in detail) {
                        setError(`Validation failed: ${Array.isArray(detail.feedback) ? detail.feedback.join(' ') : JSON.stringify(detail)}`);
                    } else {
                        setError(`Validation error: ${JSON.stringify(detail || err.response.data)}`);
                    }
                } else {
                    const msg = err.response?.data?.detail
                        ? JSON.stringify(err.response.data.detail)
                        : err.message || `Request failed with status code ${err.response?.status || 'unknown'}`;
                    setError(msg);
                }
            } else {
                setError(`Network error: ${err.message || 'Unknown error'}. Is the backend running?`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setError("No file selected.");
            return;
        }

        // Check file type
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            setError("Please select a JSON file.");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => {
            setError("Failed to read file.");
            e.target.value = '';
        };
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (!result) {
                    setError("File is empty.");
                    e.target.value = '';
                    return;
                }
                const json = JSON.parse(result as string);
                if (json.project_metadata) {
                    reset(json);
                    setError(null);
                    setStep(2); // Jump to end for review
                    console.log("JSON file imported successfully");
                } else {
                    setError("Invalid JSON structure. Missing 'project_metadata' field.");
                }
            } catch (err) {
                console.error("JSON parse error:", err);
                setError(`Failed to parse JSON file: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Glass Container */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                {/* Progress Header */}
                <div className="bg-slate-950/50 border-b border-white/5 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">
                                {step + 1}
                            </span>
                            {STEPS[step].title}
                        </h2>
                        {/* File Upload Button */}
                        <div className="relative group">
                            <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-xs font-medium border border-slate-700 text-slate-400 group-hover:text-white">
                                <Upload size={14} /> Import JSON
                            </label>
                        </div>
                    </div>

                    {/* Stepper Visual */}
                    <div className="flex gap-2">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ease-out ${i <= step ? 'bg-blue-500' : 'bg-transparent'}`}
                                    style={{ width: i < step ? '100%' : i === step ? '100%' : '0%' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 animate-fadeIn">

                    {/* Step 1: Identity & Product */}
                    {step === 0 && (
                        <div className="space-y-6 animate-slideUp">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Project Identity</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Brand Name" registration={register("project_metadata.brand_name")} error={errors.project_metadata?.brand_name} placeholder="Acme Corp" />
                                    <Input label="Website URL" registration={register("project_metadata.website_url")} error={errors.project_metadata?.website_url} placeholder="https://acme.com" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Target Country" registration={register("project_metadata.target_country")} error={errors.project_metadata?.target_country} placeholder="United States" />
                                    <Input label="Industry" registration={register("project_metadata.industry")} error={errors.project_metadata?.industry} placeholder="SaaS / E-commerce" />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Product</h3>
                                <TextArea label="Product Description" registration={register("product_definition.product_description")} error={errors.product_definition?.product_description} placeholder="Describe what you are selling in detail..." />
                                <Input label="Core Problem Solved" registration={register("product_definition.core_problem_solved")} error={errors.product_definition?.core_problem_solved} />
                                <Input label="Unique Selling Proposition" registration={register("product_definition.unique_selling_proposition")} error={errors.product_definition?.unique_selling_proposition} />
                            </section>
                        </div>
                    )}

                    {/* Step 2: Audience & Market */}
                    {step === 1 && (
                        <div className="space-y-6 animate-slideUp">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Target Audience</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Demographics" registration={register("target_audience.demographics")} error={errors.target_audience?.demographics} placeholder="Age 25-40, Urban professionals" />
                                    <Input label="Psychographics" registration={register("target_audience.psychographics")} error={errors.target_audience?.psychographics} placeholder="Ambitious, tech-savvy, values time" />
                                </div>
                                <Input label="Cultural Nuances (Optional)" registration={register("target_audience.cultural_nuances")} />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Competition</h3>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-400">Main Competitors</label>
                                    {competitors.fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2">
                                            <input
                                                {...register(`market_context.main_competitors.${index}` as const)}
                                                className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-slate-200"
                                                placeholder="Competitor Name"
                                                defaultValue={(field as any).name}
                                            />
                                            <button type="button" onClick={() => competitors.remove(index)} className="text-slate-500 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => competitors.append("New Competitor")} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                        <Plus size={14} /> Add Competitor
                                    </button>
                                    {errors.market_context?.main_competitors && <p className="text-xs text-red-400 mt-1">{errors.market_context.main_competitors.message}</p>}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Step 3: Goals */}
                    {step === 2 && (
                        <div className="space-y-6 animate-slideUp">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Campaign Goals</h3>
                                <Input label="Primary Objective" registration={register("the_creative_goal.primary_objective")} error={errors.the_creative_goal?.primary_objective} placeholder="Brand Awareness / Lead Gen" />
                                <Input label="Desired Tone" registration={register("the_creative_goal.desired_tone_of_voice")} error={errors.the_creative_goal?.desired_tone_of_voice} placeholder="Professional, Witty, Urgent" />

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-400">Channels</label>
                                    {channels.fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2">
                                            <input
                                                {...register(`the_creative_goal.specific_channels.${index}` as const)}
                                                className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-slate-200"
                                                placeholder="e.g. LinkedIn"
                                                defaultValue={(field as any).name}
                                            />
                                            <button type="button" onClick={() => channels.remove(index)} className="text-slate-500 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => channels.append("New Channel")} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                        <Plus size={14} /> Add Channel
                                    </button>
                                    {errors.the_creative_goal?.specific_channels && <p className="text-xs text-red-400 mt-1">{errors.the_creative_goal.specific_channels.message}</p>}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {step < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                            >
                                Next Step <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {loading ? "Launching Agents..." : "Launch Campaign"}
                            </button>
                        )}
                    </div>

                </form>
            </div>
        </div>
    );
};

// UI Helper Components (Styled for Dark Mode)
const Input = ({ label, registration, error, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">{label}</label>
        <input
            {...registration}
            placeholder={placeholder}
            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-700 text-slate-200"
        />
        {error && <p className="text-xs text-red-400 animate-fadeIn">{error.message}</p>}
    </div>
);

const TextArea = ({ label, registration, error, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">{label}</label>
        <textarea
            {...registration}
            rows={3}
            placeholder={placeholder}
            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-700 resize-none text-slate-200"
        />
        {error && <p className="text-xs text-red-400 animate-fadeIn">{error.message}</p>}
    </div>
);

export default JobForm;

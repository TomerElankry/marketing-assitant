import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import api from '../lib/api';
import { Upload, Plus, Trash2, Send, Loader2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

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

interface StepDef {
    label: string;
    subtitle: string;
    color: string;
    accentColor: string;
    fields: string[];
}

const STEPS: StepDef[] = [
    {
        label: "Project",
        subtitle: "Basic brand info",
        color: "blue",
        accentColor: "text-blue-400",
        fields: [
            "project_metadata.brand_name",
            "project_metadata.website_url",
            "project_metadata.target_country",
            "project_metadata.industry",
        ],
    },
    {
        label: "Product",
        subtitle: "What you're selling",
        color: "purple",
        accentColor: "text-purple-400",
        fields: [
            "product_definition.product_description",
            "product_definition.core_problem_solved",
            "product_definition.unique_selling_proposition",
        ],
    },
    {
        label: "Audience",
        subtitle: "Who you're targeting",
        color: "cyan",
        accentColor: "text-cyan-400",
        fields: [
            "target_audience.demographics",
            "target_audience.psychographics",
        ],
    },
    {
        label: "Market",
        subtitle: "Competitive landscape",
        color: "blue",
        accentColor: "text-blue-400",
        fields: ["market_context.main_competitors"],
    },
    {
        label: "Goals",
        subtitle: "Creative direction",
        color: "purple",
        accentColor: "text-purple-400",
        fields: [
            "the_creative_goal.primary_objective",
            "the_creative_goal.desired_tone_of_voice",
            "the_creative_goal.specific_channels",
        ],
    },
];

interface JobFormProps {
    onJobCreated: (jobId: string, brandName: string) => void;
}

const JobForm: React.FC<JobFormProps> = ({ onJobCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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

    const handleNext = async () => {
        const fields = STEPS[currentStep].fields as any[];
        const valid = await trigger(fields);
        if (valid) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            setCurrentStep(s => s + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(s => s - 1);
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/jobs', data);
            if (response.status === 201) {
                onJobCreated(response.data.job_id, data.project_metadata.brand_name);
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
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.project_metadata) {
                    reset(json);
                    setCompletedSteps(new Set([0, 1, 2, 3, 4]));
                    setCurrentStep(4);
                    setError(null);
                } else {
                    setError("Invalid JSON structure. Missing project_metadata?");
                }
            } catch {
                setError("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const stepBorderColors = ['border-blue-500/50', 'border-purple-500/50', 'border-cyan-500/50', 'border-blue-500/50', 'border-purple-500/50'];
    const stepBgColors = ['bg-blue-500/20', 'bg-purple-500/20', 'bg-cyan-500/20', 'bg-blue-500/20', 'bg-purple-500/20'];
    const stepTextColors = ['text-blue-400', 'text-purple-400', 'text-cyan-400', 'text-blue-400', 'text-purple-400'];

    return (
        <div className="max-w-3xl mx-auto relative">

            {/* Import JSON button - top right */}
            <div className="flex justify-end mb-4">
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-2 glass hover:glow-blue rounded-lg cursor-pointer transition-all text-sm font-medium border border-slate-600/50 hover:border-blue-500/50">
                    <Upload size={16} /> Import JSON
                </label>
            </div>

            {/* Step Progress Bar */}
            <div className="mb-8 glass-strong rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(index);
                        const isActive = index === currentStep;
                        const isFuture = index > currentStep && !completedSteps.has(index);
                        return (
                            <React.Fragment key={index}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isCompleted || index < currentStep) setCurrentStep(index);
                                    }}
                                    className={`flex flex-col items-center gap-1.5 group transition-all ${isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                                    disabled={isFuture}
                                >
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold
                                        ${isCompleted
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : isActive
                                                ? `${stepBgColors[index]} ${stepBorderColors[index]} ${stepTextColors[index]} scale-110`
                                                : 'glass border-slate-700/50 text-slate-500'}
                                    `}>
                                        {isCompleted
                                            ? <CheckCircle2 size={18} />
                                            : <span>{index + 1}</span>
                                        }
                                    </div>
                                    <div className="text-center hidden sm:block">
                                        <p className={`text-xs font-semibold ${isActive ? stepTextColors[index] : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-[10px] text-slate-600">{step.subtitle}</p>
                                    </div>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${completedSteps.has(index) ? 'bg-emerald-500/50' : 'bg-slate-700/50'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className="mt-4 text-center">
                    <span className="text-xs font-mono text-slate-500">Step {currentStep + 1} of {STEPS.length}</span>
                </div>
            </div>

            {/* Form Panel */}
            <form onSubmit={handleSubmit(onSubmit, (e) => console.log("Validation Errors:", e))}>
                <div className={`p-8 glass-strong rounded-2xl border scan-line relative overflow-hidden ${stepBorderColors[currentStep]} transition-all duration-300`}>
                    <div className="absolute inset-0 holographic opacity-20 pointer-events-none"></div>
                    <div className="relative z-10 space-y-6">

                        {/* Step Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`w-8 h-8 rounded-lg ${stepBgColors[currentStep]} flex items-center justify-center`}>
                                    <span className={`text-sm font-bold ${stepTextColors[currentStep]}`}>{currentStep + 1}</span>
                                </div>
                                <h2 className={`text-2xl font-bold text-gradient-animated`}>
                                    {currentStep === 0 && "Project Metadata"}
                                    {currentStep === 1 && "Product Definition"}
                                    {currentStep === 2 && "Target Audience"}
                                    {currentStep === 3 && "Market Context"}
                                    {currentStep === 4 && "Creative Goal"}
                                </h2>
                            </div>
                            <p className="text-sm text-slate-400 ml-11">{STEPS[currentStep].subtitle}</p>
                        </div>

                        {/* Step 1: Project Metadata */}
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Brand Name" registration={register("project_metadata.brand_name")} error={errors.project_metadata?.brand_name} placeholder="e.g. Acme Corp" />
                                    <Input label="Website URL" registration={register("project_metadata.website_url")} error={errors.project_metadata?.website_url} placeholder="https://example.com" />
                                    <Input label="Target Country" registration={register("project_metadata.target_country")} error={errors.project_metadata?.target_country} placeholder="e.g. United States" />
                                    <Input label="Industry" registration={register("project_metadata.industry")} error={errors.project_metadata?.industry} placeholder="e.g. SaaS, E-commerce" />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Product */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <TextArea label="Product Description" registration={register("product_definition.product_description")} error={errors.product_definition?.product_description} placeholder="Describe your product or service in detail..." />
                                <Input label="Core Problem Solved" registration={register("product_definition.core_problem_solved")} error={errors.product_definition?.core_problem_solved} placeholder="What pain point does it eliminate?" />
                                <Input label="Unique Selling Proposition" registration={register("product_definition.unique_selling_proposition")} error={errors.product_definition?.unique_selling_proposition} placeholder="What makes you different from competitors?" />
                            </div>
                        )}

                        {/* Step 3: Audience */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Demographics" registration={register("target_audience.demographics")} error={errors.target_audience?.demographics} placeholder="Age, gender, income, location..." />
                                    <Input label="Psychographics" registration={register("target_audience.psychographics")} error={errors.target_audience?.psychographics} placeholder="Values, interests, lifestyle..." />
                                </div>
                                <Input label="Cultural Nuances (Optional)" registration={register("target_audience.cultural_nuances")} placeholder="Any cultural context to consider?" />
                            </div>
                        )}

                        {/* Step 4: Market Context */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-300">Main Competitors</label>
                                    <div className="space-y-2">
                                        {competitors.fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2">
                                                <input
                                                    {...register(`market_context.main_competitors.${index}` as const)}
                                                    className="flex-1 glass border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-500"
                                                    placeholder="Competitor name"
                                                    defaultValue={(field as any).name}
                                                />
                                                <button type="button" onClick={() => competitors.remove(index)} className="px-3 text-slate-500 hover:text-red-400 glass border border-slate-700/50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => (competitors.append as (v: string) => void)("")} className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 py-1 transition-colors">
                                        <Plus size={14} /> Add Competitor
                                    </button>
                                    {errors.market_context?.main_competitors && (
                                        <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {errors.market_context.main_competitors.message}</p>
                                    )}
                                </div>
                                <Input label="Current Marketing Efforts (Optional)" registration={register("market_context.current_marketing_efforts")} placeholder="What are you currently doing to market?" />
                                <Input label="Known Customer Objections (Optional)" registration={register("market_context.known_customer_objections")} placeholder="Common reasons people don't buy..." />
                            </div>
                        )}

                        {/* Step 5: Creative Goal */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <Input label="Primary Objective" registration={register("the_creative_goal.primary_objective")} error={errors.the_creative_goal?.primary_objective} placeholder="e.g. Drive sign-ups, Increase brand awareness" />
                                <Input label="Desired Tone of Voice" registration={register("the_creative_goal.desired_tone_of_voice")} error={errors.the_creative_goal?.desired_tone_of_voice} placeholder="e.g. Professional, playful, bold..." />
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-300">Marketing Channels</label>
                                    <div className="space-y-2">
                                        {channels.fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2">
                                                <input
                                                    {...register(`the_creative_goal.specific_channels.${index}` as const)}
                                                    className="flex-1 glass border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-500"
                                                    placeholder="e.g. TikTok, LinkedIn, Email"
                                                    defaultValue={(field as any).name}
                                                />
                                                <button type="button" onClick={() => channels.remove(index)} className="px-3 text-slate-500 hover:text-red-400 glass border border-slate-700/50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => (channels.append as (v: string) => void)("")} className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 py-1 transition-colors">
                                        <Plus size={14} /> Add Channel
                                    </button>
                                    {errors.the_creative_goal?.specific_channels && (
                                        <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {errors.the_creative_goal.specific_channels.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl border border-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all group
                                        bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white glow-blue hover:glow-purple`}
                                >
                                    Next Step
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all glow-blue hover:glow-purple disabled:opacity-50 disabled:cursor-not-allowed text-sm group relative overflow-hidden"
                                >
                                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    {loading ? (
                                        <><Loader2 className="animate-spin relative z-10" size={16} /><span className="relative z-10">Launching...</span></>
                                    ) : (
                                        <><Send size={16} className="relative z-10" /><span className="relative z-10">Launch Analysis</span></>
                                    )}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </form>
        </div>
    );
};

// UI Helper Components
const Input = ({ label, registration, error, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <input
            {...registration}
            placeholder={placeholder}
            className="w-full glass border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-600 hover:border-slate-500/50"
        />
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {error.message}</p>}
    </div>
);

const TextArea = ({ label, registration, error, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <textarea
            {...registration}
            rows={4}
            placeholder={placeholder}
            className="w-full glass border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-600 resize-none hover:border-slate-500/50"
        />
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {error.message}</p>}
    </div>
);

export default JobForm;

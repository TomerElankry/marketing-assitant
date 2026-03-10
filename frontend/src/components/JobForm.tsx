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
    fields: string[];
}

const STEPS: StepDef[] = [
    {
        label: "Project",
        subtitle: "Basic brand info",
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
        fields: [
            "product_definition.product_description",
            "product_definition.core_problem_solved",
            "product_definition.unique_selling_proposition",
        ],
    },
    {
        label: "Audience",
        subtitle: "Who you're targeting",
        fields: [
            "target_audience.demographics",
            "target_audience.psychographics",
        ],
    },
    {
        label: "Market",
        subtitle: "Competitive landscape",
        fields: ["market_context.main_competitors"],
    },
    {
        label: "Goals",
        subtitle: "Creative direction",
        fields: [
            "the_creative_goal.primary_objective",
            "the_creative_goal.desired_tone_of_voice",
            "the_creative_goal.specific_channels",
        ],
    },
];

interface JobFormProps {
    onJobCreated: (jobId: string) => void;
    initialData?: FormData;
}

const JobForm: React.FC<JobFormProps> = ({ onJobCreated, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(
        isEditing ? new Set([0, 1, 2, 3, 4]) : new Set()
    );

    const { register, control, handleSubmit, trigger, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ?? {
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

    const handleBack = () => setCurrentStep(s => s - 1);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/jobs', data);
            if (response.status === 201) {
                onJobCreated(response.data.job_id);
            }
        } catch (err: any) {
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

    const stepTitles = [
        "Project Metadata",
        "Product Definition",
        "Target Audience",
        "Market Context",
        "Creative Goal",
    ];

    return (
        <div className="max-w-2xl mx-auto">

            {/* Import JSON */}
            <div className="flex justify-end mb-4">
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label
                    htmlFor="file-upload"
                    className="btn-ghost text-xs cursor-pointer"
                >
                    <Upload size={13} /> Import JSON
                </label>
            </div>

            {/* Step Progress */}
            <div className="warm-card mb-6 p-5">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(index);
                        const isActive = index === currentStep;
                        const isFuture = index > currentStep && !completedSteps.has(index);
                        return (
                            <React.Fragment key={index}>
                                <button
                                    type="button"
                                    onClick={() => { if (isCompleted || index < currentStep) setCurrentStep(index); }}
                                    disabled={isFuture}
                                    className={`flex flex-col items-center gap-1.5 transition-all ${isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                                >
                                    <div className={`
                                        w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold
                                        ${isCompleted
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                                            : isActive
                                                ? 'bg-[#1E3A5F]/8 border-[#1E3A5F] text-[#1E3A5F] scale-110'
                                                : 'bg-white border-[#E7E5E4] text-[#A8A29E]'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 size={16} /> : <span>{index + 1}</span>}
                                    </div>
                                    <div className="text-center hidden sm:block">
                                        <p className={`text-xs font-semibold ${isActive ? 'text-[#1E3A5F]' : isCompleted ? 'text-emerald-600' : 'text-[#A8A29E]'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-[10px] text-[#C4B5A0]">{step.subtitle}</p>
                                    </div>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${completedSteps.has(index) ? 'bg-emerald-300' : 'bg-[#E7E5E4]'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <p className="text-center text-xs text-[#A8A29E] mt-4">Step {currentStep + 1} of {STEPS.length}</p>
            </div>

            {/* Form Panel */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="warm-card p-8">

                    {/* Step Header */}
                    <div className="mb-6 pb-5 border-b border-[#F0EDEB]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center">
                                <span className="text-sm font-bold text-[#1E3A5F]">{currentStep + 1}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#1C1917]">{stepTitles[currentStep]}</h2>
                                <p className="text-xs text-[#78716C]">{STEPS[currentStep].subtitle}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">

                        {/* Step 1: Project */}
                        {currentStep === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <WInput label="Brand Name" registration={register("project_metadata.brand_name")} error={errors.project_metadata?.brand_name} placeholder="e.g. Acme Corp" />
                                <WInput label="Website URL" registration={register("project_metadata.website_url")} error={errors.project_metadata?.website_url} placeholder="https://example.com" />
                                <WInput label="Target Country" registration={register("project_metadata.target_country")} error={errors.project_metadata?.target_country} placeholder="e.g. United States" />
                                <WInput label="Industry" registration={register("project_metadata.industry")} error={errors.project_metadata?.industry} placeholder="e.g. SaaS, E-commerce" />
                            </div>
                        )}

                        {/* Step 2: Product */}
                        {currentStep === 1 && (
                            <>
                                <WTextArea label="Product Description" registration={register("product_definition.product_description")} error={errors.product_definition?.product_description} placeholder="Describe your product or service in detail..." />
                                <WInput label="Core Problem Solved" registration={register("product_definition.core_problem_solved")} error={errors.product_definition?.core_problem_solved} placeholder="What pain point does it eliminate?" />
                                <WInput label="Unique Selling Proposition" registration={register("product_definition.unique_selling_proposition")} error={errors.product_definition?.unique_selling_proposition} placeholder="What makes you different from competitors?" />
                            </>
                        )}

                        {/* Step 3: Audience */}
                        {currentStep === 2 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <WInput label="Demographics" registration={register("target_audience.demographics")} error={errors.target_audience?.demographics} placeholder="Age, gender, income, location..." />
                                    <WInput label="Psychographics" registration={register("target_audience.psychographics")} error={errors.target_audience?.psychographics} placeholder="Values, interests, lifestyle..." />
                                </div>
                                <WInput label="Cultural Nuances (Optional)" registration={register("target_audience.cultural_nuances")} placeholder="Any cultural context to consider?" />
                            </>
                        )}

                        {/* Step 4: Market */}
                        {currentStep === 3 && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-[#78716C] mb-2 uppercase tracking-wider">Main Competitors</label>
                                    <div className="space-y-2">
                                        {competitors.fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2">
                                                <input
                                                    {...register(`market_context.main_competitors.${index}` as const)}
                                                    className="warm-input flex-1"
                                                    placeholder="Competitor name"
                                                    defaultValue={(field as any).name}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => competitors.remove(index)}
                                                    className="px-3 border border-[#E7E5E4] rounded-lg text-[#A8A29E] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => (competitors.append as (v: string) => void)("")}
                                        className="mt-2 text-xs flex items-center gap-1.5 text-[#1E3A5F] hover:text-[#D97706] transition-colors font-medium"
                                    >
                                        <Plus size={13} /> Add Competitor
                                    </button>
                                    {errors.market_context?.main_competitors && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={11} /> {errors.market_context.main_competitors.message}</p>
                                    )}
                                </div>
                                <WInput label="Current Marketing Efforts (Optional)" registration={register("market_context.current_marketing_efforts")} placeholder="What are you currently doing to market?" />
                                <WInput label="Known Customer Objections (Optional)" registration={register("market_context.known_customer_objections")} placeholder="Common reasons people don't buy..." />
                            </>
                        )}

                        {/* Step 5: Goals */}
                        {currentStep === 4 && (
                            <>
                                <WInput label="Primary Objective" registration={register("the_creative_goal.primary_objective")} error={errors.the_creative_goal?.primary_objective} placeholder="e.g. Drive sign-ups, Increase brand awareness" />
                                <WInput label="Desired Tone of Voice" registration={register("the_creative_goal.desired_tone_of_voice")} error={errors.the_creative_goal?.desired_tone_of_voice} placeholder="e.g. Professional, playful, bold..." />
                                <div>
                                    <label className="block text-xs font-semibold text-[#78716C] mb-2 uppercase tracking-wider">Marketing Channels</label>
                                    <div className="space-y-2">
                                        {channels.fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2">
                                                <input
                                                    {...register(`the_creative_goal.specific_channels.${index}` as const)}
                                                    className="warm-input flex-1"
                                                    placeholder="e.g. TikTok, LinkedIn, Email"
                                                    defaultValue={(field as any).name}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => channels.remove(index)}
                                                    className="px-3 border border-[#E7E5E4] rounded-lg text-[#A8A29E] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => (channels.append as (v: string) => void)("")}
                                        className="mt-2 text-xs flex items-center gap-1.5 text-[#1E3A5F] hover:text-[#D97706] transition-colors font-medium"
                                    >
                                        <Plus size={13} /> Add Channel
                                    </button>
                                    {errors.the_creative_goal?.specific_channels && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={11} /> {errors.the_creative_goal.specific_channels.message}</p>
                                    )}
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#F0EDEB]">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="btn-ghost text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="btn-primary text-sm"
                                >
                                    Next Step
                                    <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-accent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin" size={14} /> Launching…</>
                                    ) : (
                                        <><Send size={14} /> Launch Analysis</>
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

// Warm Professional Input Components
const WInput = ({ label, registration, error, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider">{label}</label>
        <input {...registration} placeholder={placeholder} className="warm-input" />
        {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} /> {error.message}</p>}
    </div>
);

const WTextArea = ({ label, registration, error, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#78716C] uppercase tracking-wider">{label}</label>
        <textarea {...registration} rows={4} placeholder={placeholder} className="warm-input resize-none" />
        {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} /> {error.message}</p>}
    </div>
);

export default JobForm;

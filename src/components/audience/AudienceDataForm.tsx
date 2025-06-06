import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, User, Mail, MessageSquare } from 'lucide-react';
import DynamicFormRenderer from './DynamicFormRenderer';
import { useFormBuilderStore } from '../../store/formBuilderStore';

interface AudienceDataFormProps {
  onSubmitSuccess: () => void; // Callback for successful submission
}

interface FormData {
  name: string;
  email: string;
  comments: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  api?: string;
}

const AudienceDataForm: React.FC<AudienceDataFormProps> = ({ onSubmitSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    comments: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentEventId] = useState<string>('default-event'); // TODO: obtener del contexto
  
  const { activeForm, fetchActiveForm, initializeSocket } = useFormBuilderStore();

  // Verificar si hay formulario dinámico activo
  useEffect(() => {
    fetchActiveForm(currentEventId);
    initializeSocket();
  }, [currentEventId, fetchActiveForm, initializeSocket]);

  // Si hay un formulario dinámico activo, mostrarlo en lugar del formulario estático
  if (activeForm) {
    return (
      <DynamicFormRenderer
        eventId={currentEventId}
        onSubmitSuccess={onSubmitSuccess}
      />
    );
  }

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null); // Clear previous messages

    try {
      const response = await fetch('/api/audience-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', message: t('audienceDataForm.successMessage') || 'Data submitted successfully!' });
        setFormData({ name: '', email: '', comments: '' }); // Reset form
        // Optionally delay hiding the form to show success message
        setTimeout(() => {
          onSubmitSuccess(); // Call the callback to hide/transition
        }, 2000); // 2 seconds delay
      } else {
        // Handle errors from backend (e.g., validation errors)
        const errorMessage = result.errors ? result.errors.join(', ') : (result.message || t('audienceDataForm.errorMessage') || 'Failed to submit data.');
        setErrors(prevErrors => ({ ...prevErrors, api: errorMessage })); // Set a general API error
        setSubmitMessage({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error('Error submitting audience data:', error);
      const generalErrorMessage = t('audienceDataForm.errorMessage') || 'An unexpected error occurred. Please try again.';
      setErrors(prevErrors => ({ ...prevErrors, api: generalErrorMessage }));
      setSubmitMessage({ type: 'error', message: generalErrorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-bg-primary shadow-xl rounded-lg border border-border-color max-w-lg mx-auto my-8">
      <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center flex items-center justify-center">
        <User className="h-6 w-6 mr-2 text-accent" />
        {t('audienceDataForm.title')}
      </h2>
      {submitMessage && (
        <div className={`p-4 mb-4 rounded-md text-sm ${
          submitMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400'
        }`}>
          {submitMessage.message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
            <User className="h-4 w-4 mr-1 inline text-accent" />
            {t('audienceDataForm.nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-bg-secondary border ${errors.name ? 'border-red-500' : 'border-border-color'} rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70`}
            placeholder={t('audienceDataForm.namePlaceholder')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && <p id="name-error" className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            <Mail className="h-4 w-4 mr-1 inline text-accent" />
            {t('audienceDataForm.emailLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-bg-secondary border ${errors.email ? 'border-red-500' : 'border-border-color'} rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70`}
            placeholder={t('audienceDataForm.emailPlaceholder')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <p id="email-error" className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-text-secondary mb-1">
            <MessageSquare className="h-4 w-4 mr-1 inline text-accent" />
            {t('audienceDataForm.commentsLabel')}
          </label>
          <textarea
            name="comments"
            id="comments"
            rows={4}
            value={formData.comments}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-bg-secondary border border-border-color rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70"
            placeholder={t('audienceDataForm.commentsPlaceholder')}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-button-text bg-accent hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-bg-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Send className="h-5 w-5 mr-2" />
            {isSubmitting ? t('audienceDataForm.submittingButton') : t('audienceDataForm.submitButton')}
          </button>
        </div>
        {errors.api && <p className="mt-2 text-xs text-red-500 text-center">{errors.api}</p>}
      </form>
    </div>
  );
};

export default AudienceDataForm;

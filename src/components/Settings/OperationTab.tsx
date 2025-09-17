import React from 'react';
import { Arena } from '../../types';
import { FileText, Info } from 'lucide-react';

interface OperationTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{label}</label>
    <textarea rows={5} className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500" {...props} />
  </div>
);

const OperationTab: React.FC<OperationTabProps> = ({ formData, setFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      <Section title="Políticas da Arena" icon={FileText}>
        <FormTextArea
          label="Política de Cancelamento"
          name="cancellation_policy"
          value={formData.cancellation_policy || ''}
          onChange={handleChange}
          placeholder="Ex: Cancelamentos com até 24h de antecedência têm reembolso de 100%. Após esse período, não há reembolso."
        />
        <FormTextArea
          label="Termos de Uso"
          name="terms_of_use"
          value={formData.terms_of_use || ''}
          onChange={handleChange}
          placeholder="Ex: É obrigatório o uso de calçado apropriado. Proibido fumar nas dependências da quadra."
        />
      </Section>
      
      <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
        <h5 className="font-medium mb-2 flex items-center text-blue-900 dark:text-blue-200"><Info className="h-4 w-4 mr-2" />Informação</h5>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Estas políticas serão exibidas para seus clientes durante o processo de reserva para garantir que todos estejam cientes das regras.
        </p>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4 flex items-center">
      <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
      {title}
    </h3>
    <div className="space-y-6">{children}</div>
  </div>
);

export default OperationTab;

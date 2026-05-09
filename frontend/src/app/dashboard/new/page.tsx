'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { appsApi } from '@/lib/api';
import { Upload, CheckCircle, AlertCircle, Loader2, Play, FileJson } from 'lucide-react';
import toast from 'react-hot-toast';

const EXAMPLES = [
  {
    label: 'CRM App',
    icon: '👥',
    description: 'Contacts, deals, pipeline',
    config: {
      name: 'CRM App',
      description: 'A simple customer relationship manager',
      theme: { primaryColor: '#6366f1', mode: 'light', appName: 'CRM App' },
      auth: { methods: ['email'], roles: ['admin', 'user'] },
      entities: [
        {
          name: 'contact',
          fields: [
            { name: 'full_name', type: 'string', required: true },
            { name: 'email', type: 'string', unique: true },
            { name: 'phone', type: 'string' },
            { name: 'status', type: 'string', default: 'lead' },
            { name: 'notes', type: 'text' },
          ],
          timestamps: true,
          userScoped: true,
        },
        {
          name: 'deal',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'value', type: 'float' },
            { name: 'stage', type: 'string', default: 'prospect' },
            { name: 'closed_at', type: 'date' },
          ],
          timestamps: true,
        },
      ],
      pages: [
        {
          id: 'contacts', title: 'Contacts', path: '/contacts',
          components: [{
            id: 'contacts_table', type: 'table', entity: 'contact',
            searchable: true, exportable: true, importable: true,
            columns: [
              { key: 'full_name', label: 'Name', sortable: true },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'status', label: 'Status', render: 'badge' },
              { key: 'created_at', label: 'Added', render: 'date', sortable: true },
            ],
            actions: [
              { name: 'create', label: 'Add Contact', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger', confirm: 'Delete this contact?' },
            ],
            fields: [
              { name: 'full_name', label: 'Full Name', type: 'text', required: true },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'phone', label: 'Phone', type: 'phone' },
              { name: 'status', label: 'Status', type: 'select', options: ['lead', 'qualified', 'customer', 'churned'] },
              { name: 'notes', label: 'Notes', type: 'textarea' },
            ],
          }],
        },
        {
          id: 'deals', title: 'Deals', path: '/deals',
          components: [{
            id: 'deals_table', type: 'table', entity: 'deal', searchable: true,
            columns: [
              { key: 'title', label: 'Deal Title', sortable: true },
              { key: 'value', label: 'Value', render: 'currency' },
              { key: 'stage', label: 'Stage', render: 'badge' },
              { key: 'closed_at', label: 'Close Date', render: 'date' },
            ],
            actions: [
              { name: 'create', label: 'New Deal', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'title', label: 'Title', type: 'text', required: true },
              { name: 'value', label: 'Value ($)', type: 'number' },
              { name: 'stage', label: 'Stage', type: 'select', options: ['prospect', 'proposal', 'negotiation', 'won', 'lost'] },
              { name: 'closed_at', label: 'Expected Close', type: 'date' },
            ],
          }],
        },
      ],
    },
  },

  {
    label: 'Project Manager',
    icon: '📋',
    description: 'Projects, tasks, team members',
    config: {
      name: 'Project Manager',
      description: 'Track projects, tasks and team',
      theme: { primaryColor: '#0ea5e9', mode: 'light', appName: 'ProjectHub' },
      auth: { methods: ['email'], roles: ['admin', 'manager', 'member'] },
      entities: [
        {
          name: 'project',
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'string', default: 'active' },
            { name: 'priority', type: 'string', default: 'medium' },
            { name: 'start_date', type: 'date' },
            { name: 'end_date', type: 'date' },
            { name: 'budget', type: 'float' },
          ],
          timestamps: true, userScoped: true,
        },
        {
          name: 'task',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'string', default: 'todo' },
            { name: 'priority', type: 'string', default: 'normal' },
            { name: 'due_date', type: 'date' },
            { name: 'assignee', type: 'string' },
            { name: 'estimated_hours', type: 'float' },
          ],
          timestamps: true,
        },
        {
          name: 'team_member', tableName: 'team_members',
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', unique: true },
            { name: 'role', type: 'string' },
            { name: 'department', type: 'string' },
            { name: 'is_active', type: 'boolean', default: true },
          ],
          timestamps: true,
        },
      ],
      pages: [
        {
          id: 'projects', title: 'Projects', path: '/projects',
          components: [{
            id: 'projects_table', type: 'table', entity: 'project',
            searchable: true, exportable: true, importable: true,
            columns: [
              { key: 'name', label: 'Project', sortable: true },
              { key: 'status', label: 'Status', render: 'badge' },
              { key: 'priority', label: 'Priority', render: 'badge' },
              { key: 'end_date', label: 'Deadline', render: 'date', sortable: true },
              { key: 'budget', label: 'Budget', render: 'currency' },
            ],
            actions: [
              { name: 'create', label: 'New Project', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger', confirm: 'Delete project?' },
            ],
            fields: [
              { name: 'name', label: 'Project Name', type: 'text', required: true },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'status', label: 'Status', type: 'select', options: ['active', 'on_hold', 'completed', 'cancelled'] },
              { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
              { name: 'start_date', label: 'Start Date', type: 'date' },
              { name: 'end_date', label: 'End Date', type: 'date' },
              { name: 'budget', label: 'Budget ($)', type: 'currency' },
            ],
          }],
        },
        {
          id: 'tasks', title: 'Tasks', path: '/tasks',
          components: [{
            id: 'tasks_table', type: 'table', entity: 'task',
            searchable: true, exportable: true,
            columns: [
              { key: 'title', label: 'Task', sortable: true },
              { key: 'assignee', label: 'Assignee' },
              { key: 'status', label: 'Status', render: 'badge' },
              { key: 'priority', label: 'Priority', render: 'badge' },
              { key: 'due_date', label: 'Due Date', render: 'date', sortable: true },
            ],
            actions: [
              { name: 'create', label: 'Add Task', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'title', label: 'Title', type: 'text', required: true },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'status', label: 'Status', type: 'select', options: ['todo', 'in_progress', 'review', 'done', 'blocked'] },
              { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
              { name: 'assignee', label: 'Assignee', type: 'text' },
              { name: 'due_date', label: 'Due Date', type: 'date' },
              { name: 'estimated_hours', label: 'Estimated Hours', type: 'number' },
            ],
          }],
        },
        {
          id: 'team', title: 'Team', path: '/team',
          components: [{
            id: 'team_table', type: 'table', entity: 'team_member', searchable: true,
            columns: [
              { key: 'name', label: 'Name', sortable: true },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role', render: 'badge' },
              { key: 'department', label: 'Department' },
              { key: 'is_active', label: 'Active', render: 'boolean' },
            ],
            actions: [
              { name: 'create', label: 'Add Member', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Remove', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'name', label: 'Full Name', type: 'text', required: true },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'role', label: 'Role', type: 'select', options: ['admin', 'manager', 'developer', 'designer', 'qa'] },
              { name: 'department', label: 'Department', type: 'text' },
              { name: 'is_active', label: 'Active', type: 'boolean' },
            ],
          }],
        },
      ],
    },
  },

  {
    label: 'Inventory Manager',
    icon: '📦',
    description: 'Products, stock, suppliers, orders',
    config: {
      name: 'Inventory Manager',
      description: 'Track products, stock levels and suppliers',
      theme: { primaryColor: '#10b981', mode: 'light', appName: 'StockPro' },
      auth: { methods: ['email'], roles: ['admin', 'warehouse', 'viewer'] },
      entities: [
        {
          name: 'product',
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'sku', type: 'string', unique: true },
            { name: 'category', type: 'string' },
            { name: 'quantity', type: 'integer', default: 0 },
            { name: 'unit_price', type: 'float' },
            { name: 'reorder_level', type: 'integer', default: 10 },
            { name: 'location', type: 'string' },
            { name: 'is_active', type: 'boolean', default: true },
          ],
          timestamps: true,
        },
        {
          name: 'supplier',
          fields: [
            { name: 'company_name', type: 'string', required: true },
            { name: 'contact_name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'phone', type: 'string' },
            { name: 'country', type: 'string' },
            { name: 'rating', type: 'integer' },
          ],
          timestamps: true,
        },
        {
          name: 'purchase_order', tableName: 'purchase_orders',
          fields: [
            { name: 'order_number', type: 'string', unique: true },
            { name: 'product_name', type: 'string' },
            { name: 'quantity', type: 'integer' },
            { name: 'unit_cost', type: 'float' },
            { name: 'total_cost', type: 'float' },
            { name: 'status', type: 'string', default: 'pending' },
            { name: 'expected_date', type: 'date' },
            { name: 'notes', type: 'text' },
          ],
          timestamps: true,
        },
      ],
      pages: [
        {
          id: 'products', title: 'Products', path: '/products',
          components: [{
            id: 'products_table', type: 'table', entity: 'product',
            searchable: true, exportable: true, importable: true,
            columns: [
              { key: 'name', label: 'Product', sortable: true },
              { key: 'sku', label: 'SKU' },
              { key: 'category', label: 'Category', render: 'badge' },
              { key: 'quantity', label: 'Stock', sortable: true },
              { key: 'unit_price', label: 'Unit Price', render: 'currency' },
              { key: 'reorder_level', label: 'Reorder At' },
              { key: 'is_active', label: 'Active', render: 'boolean' },
            ],
            actions: [
              { name: 'create', label: 'Add Product', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger', confirm: 'Delete product?' },
            ],
            fields: [
              { name: 'name', label: 'Product Name', type: 'text', required: true },
              { name: 'sku', label: 'SKU', type: 'text' },
              { name: 'category', label: 'Category', type: 'select', options: ['Electronics', 'Clothing', 'Food', 'Tools', 'Office', 'Other'] },
              { name: 'quantity', label: 'Quantity', type: 'number' },
              { name: 'unit_price', label: 'Unit Price ($)', type: 'currency' },
              { name: 'reorder_level', label: 'Reorder Level', type: 'number' },
              { name: 'location', label: 'Warehouse Location', type: 'text' },
              { name: 'is_active', label: 'Active', type: 'boolean' },
            ],
          }],
        },
        {
          id: 'suppliers', title: 'Suppliers', path: '/suppliers',
          components: [{
            id: 'suppliers_table', type: 'table', entity: 'supplier',
            searchable: true, exportable: true,
            columns: [
              { key: 'company_name', label: 'Company', sortable: true },
              { key: 'contact_name', label: 'Contact' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'country', label: 'Country' },
              { key: 'rating', label: 'Rating', render: 'rating' },
            ],
            actions: [
              { name: 'create', label: 'Add Supplier', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'company_name', label: 'Company Name', type: 'text', required: true },
              { name: 'contact_name', label: 'Contact Person', type: 'text' },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'phone', label: 'Phone', type: 'phone' },
              { name: 'country', label: 'Country', type: 'text' },
              { name: 'rating', label: 'Rating (1-5)', type: 'number', validation: { min: 1, max: 5 } },
            ],
          }],
        },
        {
          id: 'orders', title: 'Purchase Orders', path: '/orders',
          components: [{
            id: 'orders_table', type: 'table', entity: 'purchase_order',
            searchable: true, exportable: true,
            columns: [
              { key: 'order_number', label: 'Order #', sortable: true },
              { key: 'product_name', label: 'Product' },
              { key: 'quantity', label: 'Qty' },
              { key: 'total_cost', label: 'Total', render: 'currency' },
              { key: 'status', label: 'Status', render: 'badge' },
              { key: 'expected_date', label: 'Expected', render: 'date', sortable: true },
            ],
            actions: [
              { name: 'create', label: 'New Order', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'order_number', label: 'Order Number', type: 'text', required: true },
              { name: 'product_name', label: 'Product', type: 'text', required: true },
              { name: 'quantity', label: 'Quantity', type: 'number' },
              { name: 'unit_cost', label: 'Unit Cost ($)', type: 'currency' },
              { name: 'total_cost', label: 'Total Cost ($)', type: 'currency' },
              { name: 'status', label: 'Status', type: 'select', options: ['pending', 'ordered', 'shipped', 'received', 'cancelled'] },
              { name: 'expected_date', label: 'Expected Date', type: 'date' },
              { name: 'notes', label: 'Notes', type: 'textarea' },
            ],
          }],
        },
      ],
    },
  },

  {
    label: 'HR Portal',
    icon: '🏢',
    description: 'Employees, leaves, departments',
    config: {
      name: 'HR Portal',
      description: 'Human resources management system',
      theme: { primaryColor: '#f59e0b', mode: 'light', appName: 'HR Portal' },
      auth: { methods: ['email'], roles: ['admin', 'hr', 'employee'] },
      entities: [
        {
          name: 'employee',
          fields: [
            { name: 'full_name', type: 'string', required: true },
            { name: 'email', type: 'string', unique: true },
            { name: 'phone', type: 'string' },
            { name: 'department', type: 'string' },
            { name: 'designation', type: 'string' },
            { name: 'employment_type', type: 'string', default: 'full_time' },
            { name: 'join_date', type: 'date' },
            { name: 'salary', type: 'float' },
            { name: 'status', type: 'string', default: 'active' },
          ],
          timestamps: true,
        },
        {
          name: 'leave_request', tableName: 'leave_requests',
          fields: [
            { name: 'employee_name', type: 'string', required: true },
            { name: 'leave_type', type: 'string' },
            { name: 'start_date', type: 'date', required: true },
            { name: 'end_date', type: 'date', required: true },
            { name: 'days', type: 'integer' },
            { name: 'reason', type: 'text' },
            { name: 'status', type: 'string', default: 'pending' },
            { name: 'approved_by', type: 'string' },
          ],
          timestamps: true,
        },
        {
          name: 'department',
          fields: [
            { name: 'name', type: 'string', required: true, unique: true },
            { name: 'head', type: 'string' },
            { name: 'headcount', type: 'integer', default: 0 },
            { name: 'budget', type: 'float' },
            { name: 'location', type: 'string' },
          ],
          timestamps: true,
        },
      ],
      pages: [
        {
          id: 'employees', title: 'Employees', path: '/employees',
          components: [{
            id: 'employees_table', type: 'table', entity: 'employee',
            searchable: true, exportable: true, importable: true,
            columns: [
              { key: 'full_name', label: 'Name', sortable: true },
              { key: 'email', label: 'Email' },
              { key: 'department', label: 'Department', render: 'badge' },
              { key: 'designation', label: 'Designation' },
              { key: 'employment_type', label: 'Type', render: 'badge' },
              { key: 'join_date', label: 'Joined', render: 'date', sortable: true },
              { key: 'status', label: 'Status', render: 'badge' },
            ],
            actions: [
              { name: 'create', label: 'Add Employee', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Remove', method: 'DELETE', variant: 'danger', confirm: 'Remove employee?' },
            ],
            fields: [
              { name: 'full_name', label: 'Full Name', type: 'text', required: true },
              { name: 'email', label: 'Work Email', type: 'email' },
              { name: 'phone', label: 'Phone', type: 'phone' },
              { name: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'] },
              { name: 'designation', label: 'Designation', type: 'text' },
              { name: 'employment_type', label: 'Employment Type', type: 'select', options: ['full_time', 'part_time', 'contract', 'intern'] },
              { name: 'join_date', label: 'Join Date', type: 'date' },
              { name: 'salary', label: 'Salary ($)', type: 'currency' },
              { name: 'status', label: 'Status', type: 'select', options: ['active', 'on_leave', 'resigned', 'terminated'] },
            ],
          }],
        },
        {
          id: 'leaves', title: 'Leave Requests', path: '/leaves',
          components: [{
            id: 'leaves_table', type: 'table', entity: 'leave_request',
            searchable: true, exportable: true,
            columns: [
              { key: 'employee_name', label: 'Employee', sortable: true },
              { key: 'leave_type', label: 'Type', render: 'badge' },
              { key: 'start_date', label: 'From', render: 'date' },
              { key: 'end_date', label: 'To', render: 'date' },
              { key: 'days', label: 'Days' },
              { key: 'status', label: 'Status', render: 'badge' },
              { key: 'approved_by', label: 'Approved By' },
            ],
            actions: [
              { name: 'create', label: 'New Request', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Update', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'employee_name', label: 'Employee Name', type: 'text', required: true },
              { name: 'leave_type', label: 'Leave Type', type: 'select', options: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'] },
              { name: 'start_date', label: 'Start Date', type: 'date', required: true },
              { name: 'end_date', label: 'End Date', type: 'date', required: true },
              { name: 'days', label: 'Number of Days', type: 'number' },
              { name: 'reason', label: 'Reason', type: 'textarea' },
              { name: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected', 'cancelled'] },
              { name: 'approved_by', label: 'Approved By', type: 'text' },
            ],
          }],
        },
        {
          id: 'departments', title: 'Departments', path: '/departments',
          components: [{
            id: 'dept_table', type: 'table', entity: 'department', searchable: true,
            columns: [
              { key: 'name', label: 'Department', sortable: true },
              { key: 'head', label: 'Head' },
              { key: 'headcount', label: 'Headcount' },
              { key: 'budget', label: 'Budget', render: 'currency' },
              { key: 'location', label: 'Location' },
            ],
            actions: [
              { name: 'create', label: 'Add Department', method: 'POST', variant: 'primary' },
              { name: 'edit', label: 'Edit', method: 'PUT', variant: 'secondary' },
              { name: 'delete', label: 'Delete', method: 'DELETE', variant: 'danger' },
            ],
            fields: [
              { name: 'name', label: 'Department Name', type: 'text', required: true },
              { name: 'head', label: 'Department Head', type: 'text' },
              { name: 'headcount', label: 'Headcount', type: 'number' },
              { name: 'budget', label: 'Annual Budget ($)', type: 'currency' },
              { name: 'location', label: 'Location', type: 'text' },
            ],
          }],
        },
      ],
    },
  },
];

export default function NewAppPage() {
  const [jsonText, setJsonText] = useState(JSON.stringify(EXAMPLES[0].config, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [validationResult, setValidationResult] = useState<{ warnings?: string[]; errors?: string[] } | null>(null);
  const [activeExample, setActiveExample] = useState(0);
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (config: unknown) => appsApi.create(config),
    onSuccess: (res) => {
      toast.success('App created successfully!');
      router.push(`/dashboard/apps/${res.data.app.id}`);
    },
    onError: () => toast.error('Failed to create app'),
  });

  const validateMutation = useMutation({
    mutationFn: (config: unknown) => appsApi.validate(config),
    onSuccess: (res) => setValidationResult(res.data),
    onError: () => toast.error('Validation request failed'),
  });

  const parseJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError('');
      return parsed;
    } catch (e) {
      setJsonError((e as Error).message);
      return null;
    }
  };

  const handleValidate = () => {
    const parsed = parseJSON();
    if (!parsed) return;
    validateMutation.mutate(parsed);
  };

  const handleCreate = () => {
    const parsed = parseJSON();
    if (!parsed) return;
    createMutation.mutate(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target?.result as string);
      setJsonError('');
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  const handleSelectExample = (index: number) => {
    setActiveExample(index);
    setJsonText(JSON.stringify(EXAMPLES[index].config, null, 2));
    setJsonError('');
    setValidationResult(null);
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New App</h1>
        <p className="text-gray-500 mt-1 text-sm">Choose a template or paste your own JSON config.</p>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {EXAMPLES.map((ex, i) => (
          <button key={i} onClick={() => handleSelectExample(i)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeExample === i
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }`}>
            <div className="text-2xl mb-2">{ex.icon}</div>
            <div className={`font-semibold text-sm ${activeExample === i ? 'text-indigo-700' : 'text-gray-800'}`}>
              {ex.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{ex.description}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileJson size={16} className="text-indigo-600" />
                {EXAMPLES[activeExample].icon} {EXAMPLES[activeExample].label}
              </div>
              <label className="btn-secondary text-xs cursor-pointer">
                <Upload size={14} /> Upload JSON
                <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setJsonError(''); setValidationResult(null); }}
              className="json-editor w-full h-[480px] rounded-none border-0 outline-none resize-none"
              spellCheck={false}
            />
            {jsonError && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={12} /> JSON Error: {jsonError}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleValidate} disabled={validateMutation.isPending} className="btn-secondary">
              {validateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Validate
            </button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !!jsonError} className="btn-primary">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Create App
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {validationResult && (
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" /> Validation Result
              </h3>
              {(validationResult.errors?.length || 0) === 0 && (
                <p className="text-green-600 text-sm font-medium mb-2">✓ Config is valid</p>
              )}
              {validationResult.warnings?.map((w, i) => (
                <div key={i} className="flex gap-2 text-xs text-yellow-700 bg-yellow-50 rounded p-2 mb-1">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" /> {w}
                </div>
              ))}
              {validationResult.errors?.map((e, i) => (
                <div key={i} className="flex gap-2 text-xs text-red-700 bg-red-50 rounded p-2 mb-1">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" /> {e}
                </div>
              ))}
            </div>
          )}

          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-800 mb-3">All Templates</h3>
            <div className="space-y-1">
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => handleSelectExample(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    activeExample === i ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                  }`}>
                  <span>{ex.icon}</span>
                  <div>
                    <div className="font-medium">{ex.label}</div>
                    <div className="text-xs text-gray-400">{ex.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-sm text-blue-800 mb-2">💡 Fault Tolerant</h3>
            <p className="text-xs text-blue-700">Missing fields, wrong key names, and invalid types are automatically fixed.</p>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-800 mb-2">What gets created</h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>✅ PostgreSQL tables for all entities</li>
              <li>✅ Full CRUD API endpoints</li>
              <li>✅ Dynamic UI with forms & tables</li>
              <li>✅ Search, sort & pagination</li>
              <li>✅ CSV import & export</li>
              <li>✅ JWT authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
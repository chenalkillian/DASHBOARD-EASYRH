const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-subtitle">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;

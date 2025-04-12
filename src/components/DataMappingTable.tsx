import React from 'react';
import type { ScrapedField } from '../types';

interface DataMappingTableProps {
  scrapedFields: ScrapedField[];
  mappings: Record<string, string>; // { scrapedFieldName: desiredFieldName }
  onMappingChange: (scrapedField: string, desiredField: string) => void;
}

const DataMappingTable: React.FC<DataMappingTableProps> = ({
  scrapedFields,
  mappings,
  onMappingChange,
}) => {
  return (
    <table className="mapping-table">
      <thead>
        <tr>
          <th>Scraped Field Name</th>
          <th>Scraped Value (Detail Only)</th>
          <th>Desired Field Name (Your Mapping)</th>
        </tr>
      </thead>
      <tbody>
        {scrapedFields.map((field) => (
          <tr
            key={`${field.source}-${field.fieldName}`}
            className={field.source === 'detail' ? 'detail-row' : 'list-row'}
          >
            <td>{field.fieldName} ({field.source})</td>
            <td>{field.source === 'detail' ? (field.fieldValue ?? <i className='novalue'>No Value</i>) : '-'}</td>
            <td>
              <input
                type="text"
                value={mappings[field.fieldName] || ''}
                onChange={(e) => onMappingChange(field.fieldName, e.target.value)}
                placeholder="Enter desired name (e.g., askingPrice)"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataMappingTable;
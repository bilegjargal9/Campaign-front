// CustomerPagination.js
import React from 'react';

const CustomerPagination = ({ 
    currentPage, 
    totalPages, 
    startIndex, 
    endIndex, 
    customersCount,
    onPageChange 
}) => {
    return (
        <div className="flex justify-between items-center mt-4 pl-10">
            <div>
                <span className="text-gray-600">
                    {startIndex + 1} - {Math.min(endIndex, customersCount)} нийт хэрэглэгч {customersCount}
                </span>
            </div>
            <div className="flex gap-2">
                <button
                    className="w-8 h-8 flex items-center justify-center rounded-md border"
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                >
                    &lt;
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                    // Show pages around current page for better UX when many pages
                    let pageToShow = index + 1;
                    if (totalPages > 5 && currentPage > 3) {
                        if (index === 0) pageToShow = 1;
                        else if (index === 1) pageToShow = currentPage > 4 ? '...' : 2;
                        else if (index === 2) pageToShow = currentPage;
                        else if (index === 3) pageToShow = totalPages > currentPage + 1 ? '...' : totalPages - 1;
                        else pageToShow = totalPages;
                    }
                    
                    return (
                        <button
                            key={index}
                            className={`w-8 h-8 flex items-center justify-center rounded-md border ${
                                currentPage === pageToShow ? 'bg-[#405fa3] text-white' : ''
                            }`}
                            onClick={() => typeof pageToShow === 'number' && onPageChange(pageToShow)}
                            disabled={typeof pageToShow !== 'number'}
                        >
                            {pageToShow}
                        </button>
                    );
                })}
                <button
                    className="w-8 h-8 flex items-center justify-center rounded-md border"
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
};

export default CustomerPagination;
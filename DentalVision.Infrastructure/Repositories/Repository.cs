using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DentalVision.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DentalVision.Infrastructure.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly DbContext Context;

        public Repository(DbContext context)
        {
            Context = context;
        }

        public async Task<T?> GetByIdAsync(int id)
        {
            return await Context.Set<T>().FindAsync(id);
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await Context.Set<T>().ToListAsync();
        }

        public IQueryable<T> Find(Expression<Func<T, bool>> predicate)
        {
            return Context.Set<T>().Where(predicate);
        }

        public async Task AddAsync(T entity)
        {
            await Context.Set<T>().AddAsync(entity);
        }

        public void Update(T entity)
        {
            Context.Set<T>().Update(entity);
        }

        public void Remove(T entity)
        {
            Context.Set<T>().Remove(entity);
        }
    }
}

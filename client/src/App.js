import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useQuery, useMutation, useSubscription } from "@apollo/react-hooks";

export const changeCompanyNameMutation = gql`
  mutation ChangeCompanyName($input: ChangeCompanyInput!) {
    changeCompanyName(input: $input) {
      id
      name
    }
  }
`;

const useChangeCompanyNameMutation = () => {
  let [mutate] = useMutation(changeCompanyNameMutation);

  return ({ id, name }) => {
    mutate({
      variables: { input: { id, name } },
      optimisticResponse: {
        changeCompanyName: {
          __typename: "Company",
          id,
          name,
        },
      },
    });
  };
};

export const nameChangedSubscription = gql`
  subscription CompanyNameChanged {
    companyNameChanged {
      id
      name
    }
  }
`;

const useCompanyNameChanged = () => useSubscription(nameChangedSubscription);

export const companyAddedSubscription = gql`
  subscription CompanyAdded {
    companyAdded {
      id
      name
    }
  }
`;

const useCompanyAdded = () => useSubscription(companyAddedSubscription);

const query = gql`
  query Companies {
    companies {
      id
      name
    }
  }
`;

const useCompaniesQuery = () =>
  useQuery(query, {
    //pollInterval: 1000,
  });

const ChangeName = ({ company }) => {
  let changeName = useChangeCompanyNameMutation();
  let [name, setName] = useState(company.name);

  useEffect(() => {
    setName(company.name);
  }, [setName, company]);

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => changeName({ id: company.id, name })}>
        Rename
      </button>
    </div>
  );
};

const AddCompany = () => {
  let addCompany = useAddCompanyMutation();
  let [name, setName] = useState();
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => addCompany(name)}>Add</button>
    </div>
  );
};

const deleteCompanyMutation = gql`
  mutation DeleteCompany($id: Int!) {
    deleteCompany(id: $id)
  }
`;

const useDeleteCompanyMutation = () => {
  let [deleteCompany] = useMutation(deleteCompanyMutation); 
  return (id) => {
    return deleteCompany({
      variables: { id },
      update: (store) => {
        const data = store.readQuery({
          query,
        });

        store.writeQuery({
          query,
          data: {
            companies: data.companies.filter(
              (currentCompany) => currentCompany.id !== id
            ),
          },
        });
      },
    });
  };
};

const addCompanyMutation = gql`
  mutation AddCompany($name: String!) {
    addCompany(name: $name) {
      name
    }
  }
`;

const useAddCompanyMutation = () => {
  let [addCompany] = useMutation(addCompanyMutation);

  return (name) => {
    return addCompany({
      variables: { name },
      optimisticResponse: {
        addCompany: {
          __typename: "Company",
          name,
        },
      },
    });
  };
};

const Companies = () => {
  useCompanyNameChanged();
  useCompanyAdded();
  let { data, loading, error } = useCompaniesQuery();
  let deleteCompany = useDeleteCompanyMutation();

  if (!data || !data.companies) return null;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div>
      {data.companies.map((company) => (
        <div key={company.id}>
          <h3>{company.name}</h3>
          <button onClick={() => deleteCompany(company.id)}>
            Delete Company
          </button>
          <ChangeName company={company} />
        </div>
      ))}
      <br/>
      <hr/>
      <br/>
      <h1>add a new company</h1>
      <AddCompany />
    </div>
  );
};

const App = () => (
  <React.Fragment>
    <Companies />
  </React.Fragment>
);

export default App;
